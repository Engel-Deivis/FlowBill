const prisma = require('../../config/db')

const listar = (empresaId, search) => {
  const where = { empresaId, activo: true }
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { rnc: { contains: search } },
      { cedula: { contains: search } },
      { email: { contains: search, mode: 'insensitive' } },
    ]
  }
  return prisma.cliente.findMany({ where, orderBy: { nombre: 'asc' } })
}

const obtener = (id, empresaId) =>
  prisma.cliente.findFirstOrThrow({ where: { id, empresaId } })

const crear = (data) =>
  prisma.cliente.create({ data })

const actualizar = (id, empresaId, data) =>
  prisma.cliente.updateMany({ where: { id, empresaId }, data })

const eliminar = (id, empresaId) =>
  prisma.cliente.updateMany({ where: { id, empresaId }, data: { activo: false } })

module.exports = { listar, obtener, crear, actualizar, eliminar }
