const prisma = require('../../config/db')
const ncfSvc = require('../ncf/ncf.service')

/**
 * Calcula totales de una factura a partir de sus items.
 * subtotal = suma de (precio * cantidad - descuento) por item
 * itbis    = suma de itbis por item
 * total    = subtotal + itbis - descuento global
 */
const calcularTotales = (items) => {
  let subtotal = 0
  let itbisTotal = 0

  const itemsCalculados = items.map((item) => {
    const base = parseFloat(item.precio) * parseInt(item.cantidad)
    const descItem = parseFloat(item.descuento || 0)
    const baseNeta = base - descItem
    const itbisItem = baseNeta * parseFloat(item.itbis || 0)
    const subtotalItem = baseNeta + itbisItem

    subtotal += baseNeta
    itbisTotal += itbisItem

    return {
      productoId: item.productoId,
      cantidad: parseInt(item.cantidad),
      precio: parseFloat(item.precio),
      descuento: descItem,
      itbis: itbisItem,
      subtotal: subtotalItem,
    }
  })

  return { itemsCalculados, subtotal, itbisTotal }
}

const listar = (empresaId, { estado, clienteId, desde, hasta } = {}) => {
  const where = { empresaId }
  if (estado) where.estado = estado
  if (clienteId) where.clienteId = clienteId
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) where.fecha.lte = new Date(hasta)
  }
  return prisma.factura.findMany({
    where,
    include: {
      cliente: { select: { nombre: true, rnc: true, cedula: true } },
      usuario: { select: { nombre: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const obtener = (id, empresaId) =>
  prisma.factura.findFirstOrThrow({
    where: { id, empresaId },
    include: {
      cliente: true,
      usuario: { select: { nombre: true, email: true } },
      empresa: true,
      items: { include: { producto: { select: { nombre: true, codigo: true } } } },
    },
  })

const crear = async (body, empresaId, usuarioId) => {
  const { clienteId, items, notas, tipoNcf, descuentoGlobal } = body

  if (!items || items.length === 0) throw { status: 400, message: 'La factura debe tener al menos un item.' }

  // Cargar precios y tasa ITBIS actuales de cada producto
  const productIds = items.map((i) => i.productoId)
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds }, empresaId, activo: true },
  })

  if (productos.length !== productIds.length) {
    throw { status: 400, message: 'Uno o más productos no existen o están inactivos.' }
  }

  const itemsConPrecio = items.map((item) => {
    const prod = productos.find((p) => p.id === item.productoId)
    return {
      productoId: item.productoId,
      cantidad: parseInt(item.cantidad),
      precio: item.precio !== undefined ? parseFloat(item.precio) : parseFloat(prod.precio),
      descuento: parseFloat(item.descuento || 0),
      itbis: parseFloat(prod.itbis),
    }
  })

  const { itemsCalculados, subtotal, itbisTotal } = calcularTotales(itemsConPrecio)
  const descuento = parseFloat(descuentoGlobal || 0)
  const total = subtotal + itbisTotal - descuento

  // Generar correlativo único por empresa
  const conteo = await prisma.factura.count({ where: { empresaId } })
  const numero = `F-${String(conteo + 1).padStart(6, '0')}`

  // NCF opcional
  let ncf = null
  let secuenciaNcfId = null
  if (tipoNcf) {
    const ncfData = await ncfSvc.siguiente(empresaId, tipoNcf)
    ncf = ncfData.ncf
    secuenciaNcfId = ncfData.secuenciaNcfId
  }

  // Transacción: crear factura + items + movimientos de inventario
  return prisma.$transaction(async (tx) => {
    const factura = await tx.factura.create({
      data: {
        numero,
        ncf,
        subtotal,
        descuento,
        itbis: itbisTotal,
        total,
        notas,
        empresaId,
        clienteId: clienteId || null,
        usuarioId,
        secuenciaNcfId,
        items: { create: itemsCalculados },
      },
      include: {
        items: { include: { producto: { select: { nombre: true } } } },
        cliente: true,
      },
    })

    // Reducir stock y registrar movimiento por cada item
    for (const item of itemsCalculados) {
      await tx.producto.update({
        where: { id: item.productoId },
        data: { stock: { decrement: item.cantidad } },
      })
      await tx.movimientoInventario.create({
        data: {
          tipo: 'SALIDA',
          cantidad: item.cantidad,
          motivo: `Factura ${numero}`,
          empresaId,
          productoId: item.productoId,
        },
      })
    }

    return factura
  })
}

const cambiarEstado = async (id, empresaId, estado) => {
  const factura = await prisma.factura.findFirstOrThrow({ where: { id, empresaId }, include: { items: true } })

  if (factura.estado === 'ANULADA') throw { status: 400, message: 'La factura ya está anulada.' }

  return prisma.$transaction(async (tx) => {
    const actualizada = await tx.factura.update({ where: { id }, data: { estado } })

    // Si se anula: devolver stock
    if (estado === 'ANULADA') {
      for (const item of factura.items) {
        await tx.producto.update({
          where: { id: item.productoId },
          data: { stock: { increment: item.cantidad } },
        })
        await tx.movimientoInventario.create({
          data: {
            tipo: 'ENTRADA',
            cantidad: item.cantidad,
            motivo: `Anulación factura ${factura.numero}`,
            empresaId,
            productoId: item.productoId,
          },
        })
      }
    }

    return actualizada
  })
}

module.exports = { listar, obtener, crear, cambiarEstado }
