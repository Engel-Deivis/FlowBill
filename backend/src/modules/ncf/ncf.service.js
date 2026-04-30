const prisma = require('../../config/db')
const { generarNcf } = require('../../utils/ncf.generator')

const listar = (empresaId) =>
  prisma.secuenciaNcf.findMany({ where: { empresaId }, orderBy: { tipoNcf: 'asc' } })

const obtener = (id, empresaId) =>
  prisma.secuenciaNcf.findFirstOrThrow({ where: { id, empresaId } })

const crear = (data) =>
  prisma.secuenciaNcf.create({ data })

const actualizar = (id, empresaId, data) =>
  prisma.secuenciaNcf.updateMany({ where: { id, empresaId }, data })

/**
 * Obtiene el siguiente NCF disponible para una empresa y tipo, e incrementa la secuencia.
 * Retorna el NCF generado (ej. "B0100000001").
 */
const siguiente = async (empresaId, tipoNcf) => {
  const secuencia = await prisma.secuenciaNcf.findFirst({
    where: { empresaId, tipoNcf, activa: true },
  })

  if (!secuencia) throw { status: 404, message: `No hay secuencia NCF activa para tipo ${tipoNcf}.` }
  if (secuencia.secuenciaActual >= secuencia.secuenciaMax) {
    throw { status: 409, message: `Secuencia NCF ${tipoNcf} agotada. Configure una nueva secuencia.` }
  }
  if (new Date(secuencia.vencimiento) < new Date()) {
    throw { status: 409, message: `Secuencia NCF ${tipoNcf} vencida. Configure una nueva secuencia.` }
  }

  const ncf = generarNcf(secuencia.prefijo, secuencia.secuenciaActual)

  await prisma.secuenciaNcf.update({
    where: { id: secuencia.id },
    data: { secuenciaActual: secuencia.secuenciaActual + 1 },
  })

  return { ncf, secuenciaNcfId: secuencia.id }
}

module.exports = { listar, obtener, crear, actualizar, siguiente }
