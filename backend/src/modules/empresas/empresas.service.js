const prisma = require('../../config/db')

const listar = () =>
  prisma.empresa.findMany({ orderBy: { nombre: 'asc' } })

const obtener = (id) =>
  prisma.empresa.findUniqueOrThrow({ where: { id } })

const crear = (data) =>
  prisma.empresa.create({ data })

const actualizar = (id, data) =>
  prisma.empresa.update({ where: { id }, data })

const desactivar = (id) =>
  prisma.empresa.update({ where: { id }, data: { activa: false } })

module.exports = { listar, obtener, crear, actualizar, desactivar }
