const svc = require('./empresas.service')
const { ok, fail } = require('../../utils/response')

const listar = async (req, res, next) => {
  try { ok(res, await svc.listar()) } catch (e) { next(e) }
}

const obtener = async (req, res, next) => {
  try { ok(res, await svc.obtener(req.params.id)) } catch (e) { next(e) }
}

const crear = async (req, res, next) => {
  try {
    const { nombre, rnc, direccion, telefono, email } = req.body
    if (!nombre || !rnc) return fail(res, 'nombre y rnc son requeridos.')
    ok(res, await svc.crear({ nombre, rnc, direccion, telefono, email }), 201)
  } catch (e) { next(e) }
}

const actualizar = async (req, res, next) => {
  try {
    const { nombre, rnc, direccion, telefono, email, logo, activa } = req.body
    ok(res, await svc.actualizar(req.params.id, { nombre, rnc, direccion, telefono, email, logo, activa }))
  } catch (e) { next(e) }
}

const desactivar = async (req, res, next) => {
  try { ok(res, await svc.desactivar(req.params.id)) } catch (e) { next(e) }
}

module.exports = { listar, obtener, crear, actualizar, desactivar }
