const svc = require('./inventario.service')
const { ok, fail } = require('../../utils/response')

const listar = async (req, res, next) => {
  try {
    const { productoId, tipo, desde, hasta } = req.query
    ok(res, await svc.listar(req.user.empresaId, { productoId, tipo, desde, hasta }))
  } catch (e) { next(e) }
}

const registrar = async (req, res, next) => {
  try {
    const { productoId, tipo, cantidad, motivo } = req.body
    if (!productoId || !tipo || !cantidad) return fail(res, 'productoId, tipo y cantidad son requeridos.')
    const tiposValidos = ['ENTRADA', 'SALIDA', 'AJUSTE']
    if (!tiposValidos.includes(tipo)) return fail(res, `tipo debe ser: ${tiposValidos.join(', ')}`)
    ok(res, await svc.registrar({ productoId, tipo, cantidad, motivo, empresaId: req.user.empresaId }), 201)
  } catch (e) { next(e) }
}

const stockBajo = async (req, res, next) => {
  try { ok(res, await svc.stockBajo(req.user.empresaId)) } catch (e) { next(e) }
}

module.exports = { listar, registrar, stockBajo }
