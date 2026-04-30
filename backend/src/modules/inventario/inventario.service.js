const prisma = require('../../config/db')

const listar = (empresaId, { productoId, tipo, desde, hasta } = {}) => {
  const where = { empresaId }
  if (productoId) where.productoId = productoId
  if (tipo) where.tipo = tipo
  if (desde || hasta) {
    where.createdAt = {}
    if (desde) where.createdAt.gte = new Date(desde)
    if (hasta) where.createdAt.lte = new Date(hasta)
  }
  return prisma.movimientoInventario.findMany({
    where,
    include: { producto: { select: { nombre: true, codigo: true, stock: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

const registrar = async ({ productoId, tipo, cantidad, motivo, empresaId }) => {
  const producto = await prisma.producto.findFirstOrThrow({ where: { id: productoId, empresaId } })

  const delta = tipo === 'ENTRADA' ? parseInt(cantidad) : tipo === 'SALIDA' ? -parseInt(cantidad) : 0
  const nuevoStock = tipo === 'AJUSTE' ? parseInt(cantidad) : producto.stock + delta

  if (nuevoStock < 0) throw { status: 400, message: 'Stock insuficiente para esta operación.' }

  return prisma.$transaction(async (tx) => {
    const movimiento = await tx.movimientoInventario.create({
      data: {
        tipo,
        cantidad: parseInt(cantidad),
        motivo,
        empresaId,
        productoId,
      },
      include: { producto: { select: { nombre: true, stock: true } } },
    })
    await tx.producto.update({ where: { id: productoId }, data: { stock: nuevoStock } })
    return movimiento
  })
}

const stockBajo = (empresaId) =>
  prisma.$queryRaw`
    SELECT id, nombre, codigo, stock, "stockMinimo", precio
    FROM productos
    WHERE "empresaId" = ${empresaId}
      AND activo = true
      AND stock <= "stockMinimo"
    ORDER BY stock ASC
  `

module.exports = { listar, registrar, stockBajo }
