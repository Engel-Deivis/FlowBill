const svc = require('./clientes.service')
const { ok, fail } = require('../../utils/response')

const listar = async (req, res, next) => {
  try {
    ok(res, await svc.listar(req.user.empresaId, req.query.search))
  } catch (e) { next(e) }
}

const obtener = async (req, res, next) => {
  try {
    ok(res, await svc.obtener(req.params.id, req.user.empresaId))
  } catch (e) { next(e) }
}

const crear = async (req, res, next) => {
  try {
    const { nombre, cedula, rnc, email, telefono, direccion } = req.body
    if (!nombre) return fail(res, 'nombre es requerido.')
    ok(res, await svc.crear({ nombre, cedula, rnc, email, telefono, direccion, empresaId: req.user.empresaId }), 201)
  } catch (e) { next(e) }
}

const actualizar = async (req, res, next) => {
  try {
    const { nombre, cedula, rnc, email, telefono, direccion } = req.body
    await svc.actualizar(req.params.id, req.user.empresaId, { nombre, cedula, rnc, email, telefono, direccion })
    ok(res, await svc.obtener(req.params.id, req.user.empresaId))
  } catch (e) { next(e) }
}

const eliminar = async (req, res, next) => {
  try {
    await svc.eliminar(req.params.id, req.user.empresaId)
    ok(res, { message: 'Cliente eliminado.' })
  } catch (e) { next(e) }
}

module.exports = { listar, obtener, crear, actualizar, eliminar }
