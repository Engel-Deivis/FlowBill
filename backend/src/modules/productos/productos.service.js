const prisma = require('../../config/db')

const listar = (empresaId, search) => {
  const where = { empresaId, activo: true }
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { codigo: { contains: search, mode: 'insensitive' } },
    ]
  }
  return prisma.producto.findMany({
    where,
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  })
}

const obtener = (id, empresaId) =>
  prisma.producto.findFirstOrThrow({ where: { id, empresaId }, include: { categoria: true } })

const crear = (data) =>
  prisma.producto.create({ data, include: { categoria: true } })

const actualizar = (id, empresaId, data) =>
  prisma.producto.update({ where: { id }, data, include: { categoria: true } })

const eliminar = (id, empresaId) =>
  prisma.producto.updateMany({ where: { id, empresaId }, data: { activo: false } })

// Categorías
const listarCategorias = () =>
  prisma.categoria.findMany({ orderBy: { nombre: 'asc' } })

const crearCategoria = (nombre) =>
  prisma.categoria.create({ data: { nombre } })

module.exports = { listar, obtener, crear, actualizar, eliminar, listarCategorias, crearCategoria }
