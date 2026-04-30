const svc = require('./reportes.service')
const { ok } = require('../../utils/response')

const ventas = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query
    ok(res, await svc.ventas(req.user.empresaId, { desde, hasta }))
  } catch (e) { next(e) }
}

const ventasPorDia = async (req, res, next) => {
  try {
    const dias = parseInt(req.query.dias) || 30
    ok(res, await svc.ventasPorDia(req.user.empresaId, dias))
  } catch (e) { next(e) }
}

const topClientes = async (req, res, next) => {
  try {
    const limite = parseInt(req.query.limite) || 10
    ok(res, await svc.topClientes(req.user.empresaId, limite))
  } catch (e) { next(e) }
}

const itbis = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query
    ok(res, await svc.itbis(req.user.empresaId, { desde, hasta }))
  } catch (e) { next(e) }
}

const inventarioActual = async (req, res, next) => {
  try {
    ok(res, await svc.inventarioActual(req.user.empresaId))
  } catch (e) { next(e) }
}

module.exports = { ventas, ventasPorDia, topClientes, itbis, inventarioActual }
