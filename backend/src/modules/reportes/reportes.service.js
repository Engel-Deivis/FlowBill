const prisma = require('../../config/db')

const ventas = async (empresaId, { desde, hasta } = {}) => {
  const where = { empresaId, estado: { not: 'ANULADA' } }
  if (desde || hasta) {
    where.fecha = {}
    if (desde) where.fecha.gte = new Date(desde)
    if (hasta) where.fecha.lte = new Date(hasta)
  }

  const [facturas, totales] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: { cliente: { select: { nombre: true } } },
      orderBy: { fecha: 'desc' },
      take: 100,
    }),
    prisma.factura.aggregate({
      where,
      _sum: { subtotal: true, itbis: true, total: true, descuento: true },
      _count: { id: true },
    }),
  ])

  return {
    resumen: {
      totalFacturas: totales._count.id,
      subtotal: totales._sum.subtotal || 0,
      itbis: totales._sum.itbis || 0,
      descuentos: totales._sum.descuento || 0,
      totalVentas: totales._sum.total || 0,
    },
    facturas,
  }
}

const ventasPorDia = async (empresaId, dias = 30) => {
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)

  const facturas = await prisma.factura.findMany({
    where: { empresaId, estado: { not: 'ANULADA' }, fecha: { gte: desde } },
    select: { fecha: true, total: true },
    orderBy: { fecha: 'asc' },
  })

  // Agrupar por día
  const porDia = {}
  for (const f of facturas) {
    const dia = f.fecha.toISOString().split('T')[0]
    if (!porDia[dia]) porDia[dia] = { fecha: dia, total: 0, cantidad: 0 }
    porDia[dia].total += parseFloat(f.total)
    porDia[dia].cantidad += 1
  }

  return Object.values(porDia)
}

const topClientes = async (empresaId, limite = 10) => {
  const data = await prisma.factura.groupBy({
    by: ['clienteId'],
    where: { empresaId, estado: { not: 'ANULADA' }, clienteId: { not: null } },
    _sum: { total: true },
    _count: { id: true },
    orderBy: { _sum: { total: 'desc' } },
    take: limite,
  })

  const clientes = await prisma.cliente.findMany({
    where: { id: { in: data.map((d) => d.clienteId) } },
    select: { id: true, nombre: true, rnc: true, cedula: true },
  })

  return data.map((d) => ({
    ...clientes.find((c) => c.id === d.clienteId),
    totalCompras: d._sum.total,
    cantidadFacturas: d._count.id,
  }))
}

const itbis = async (empresaId, { desde, hasta } = {}) => {
  const where = { empresaId, estado: { not: 'ANULADA' } }
  if (desde) where.fecha = { gte: new Date(desde) }
  if (hasta) where.fecha = { ...where.fecha, lte: new Date(hasta) }

  return prisma.factura.aggregate({
    where,
    _sum: { itbis: true, subtotal: true, total: true },
    _count: { id: true },
  })
}

const inventarioActual = (empresaId) =>
  prisma.producto.findMany({
    where: { empresaId, activo: true },
    include: { categoria: true },
    orderBy: { stock: 'asc' },
  })

module.exports = { ventas, ventasPorDia, topClientes, itbis, inventarioActual }
