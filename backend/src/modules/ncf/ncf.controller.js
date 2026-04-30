const svc = require('./ncf.service')
const { ok, fail } = require('../../utils/response')

const listar = async (req, res, next) => {
  try { ok(res, await svc.listar(req.user.empresaId)) } catch (e) { next(e) }
}

const obtener = async (req, res, next) => {
  try { ok(res, await svc.obtener(req.params.id, req.user.empresaId)) } catch (e) { next(e) }
}

const crear = async (req, res, next) => {
  try {
    const { tipoNcf, prefijo, secuenciaMin, secuenciaMax, vencimiento } = req.body
    if (!tipoNcf || !prefijo || !secuenciaMin || !secuenciaMax || !vencimiento) {
      return fail(res, 'tipoNcf, prefijo, secuenciaMin, secuenciaMax y vencimiento son requeridos.')
    }
    ok(res, await svc.crear({
      tipoNcf,
      prefijo,
      secuenciaMin: parseInt(secuenciaMin),
      secuenciaMax: parseInt(secuenciaMax),
      secuenciaActual: parseInt(secuenciaMin) - 1,
      vencimiento: new Date(vencimiento),
      empresaId: req.user.empresaId,
    }), 201)
  } catch (e) { next(e) }
}

const actualizar = async (req, res, next) => {
  try {
    const { prefijo, secuenciaMin, secuenciaMax, vencimiento, activa } = req.body
    await svc.actualizar(req.params.id, req.user.empresaId, {
      prefijo,
      secuenciaMin: secuenciaMin ? parseInt(secuenciaMin) : undefined,
      secuenciaMax: secuenciaMax ? parseInt(secuenciaMax) : undefined,
      vencimiento: vencimiento ? new Date(vencimiento) : undefined,
      activa,
    })
    ok(res, await svc.obtener(req.params.id, req.user.empresaId))
  } catch (e) { next(e) }
}

const siguiente = async (req, res, next) => {
  try {
    const { tipoNcf } = req.params
    ok(res, await svc.siguiente(req.user.empresaId, tipoNcf))
  } catch (e) { next(e) }
}

module.exports = { listar, obtener, crear, actualizar, siguiente }
