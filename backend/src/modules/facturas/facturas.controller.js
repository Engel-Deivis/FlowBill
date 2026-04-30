const svc = require('./facturas.service')
const { generarFacturaPdf } = require('../../utils/pdf.generator')
const { ok, fail } = require('../../utils/response')

const listar = async (req, res, next) => {
  try {
    const { estado, clienteId, desde, hasta } = req.query
    ok(res, await svc.listar(req.user.empresaId, { estado, clienteId, desde, hasta }))
  } catch (e) { next(e) }
}

const obtener = async (req, res, next) => {
  try {
    ok(res, await svc.obtener(req.params.id, req.user.empresaId))
  } catch (e) { next(e) }
}

const crear = async (req, res, next) => {
  try {
    const factura = await svc.crear(req.body, req.user.empresaId, req.user.id)
    ok(res, factura, 201)
  } catch (e) { next(e) }
}

const cambiarEstado = async (req, res, next) => {
  try {
    const { estado } = req.body
    const estadosValidos = ['PENDIENTE', 'PAGADA', 'ANULADA']
    if (!estadosValidos.includes(estado)) return fail(res, `Estado inválido. Use: ${estadosValidos.join(', ')}`)
    ok(res, await svc.cambiarEstado(req.params.id, req.user.empresaId, estado))
  } catch (e) { next(e) }
}

const descargarPdf = async (req, res, next) => {
  try {
    const factura = await svc.obtener(req.params.id, req.user.empresaId)
    generarFacturaPdf(factura, res)
  } catch (e) { next(e) }
}

module.exports = { listar, obtener, crear, cambiarEstado, descargarPdf }
