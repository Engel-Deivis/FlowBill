const svc = require('./productos.service')
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
    const { nombre, descripcion, codigo, precio, costo, itbis, stock, stockMinimo, categoriaId } = req.body
    if (!nombre || precio === undefined) return fail(res, 'nombre y precio son requeridos.')
    ok(res, await svc.crear({
      nombre, descripcion, codigo,
      precio: parseFloat(precio),
      costo: costo ? parseFloat(costo) : null,
      itbis: itbis !== undefined ? parseFloat(itbis) : 0.18,
      stock: parseInt(stock) || 0,
      stockMinimo: parseInt(stockMinimo) || 5,
      categoriaId: categoriaId || null,
      empresaId: req.user.empresaId,
    }), 201)
  } catch (e) { next(e) }
}

const actualizar = async (req, res, next) => {
  try {
    const { nombre, descripcion, codigo, precio, costo, itbis, stock, stockMinimo, categoriaId, activo } = req.body
    ok(res, await svc.actualizar(req.params.id, req.user.empresaId, {
      nombre, descripcion, codigo,
      precio: precio !== undefined ? parseFloat(precio) : undefined,
      costo: costo !== undefined ? parseFloat(costo) : undefined,
      itbis: itbis !== undefined ? parseFloat(itbis) : undefined,
      stock: stock !== undefined ? parseInt(stock) : undefined,
      stockMinimo: stockMinimo !== undefined ? parseInt(stockMinimo) : undefined,
      categoriaId: categoriaId || null,
      activo,
    }))
  } catch (e) { next(e) }
}

const eliminar = async (req, res, next) => {
  try {
    await svc.eliminar(req.params.id, req.user.empresaId)
    ok(res, { message: 'Producto eliminado.' })
  } catch (e) { next(e) }
}

const listarCategorias = async (req, res, next) => {
  try { ok(res, await svc.listarCategorias()) } catch (e) { next(e) }
}

const crearCategoria = async (req, res, next) => {
  try {
    const { nombre } = req.body
    if (!nombre) return fail(res, 'nombre es requerido.')
    ok(res, await svc.crearCategoria(nombre), 201)
  } catch (e) { next(e) }
}

module.exports = { listar, obtener, crear, actualizar, eliminar, listarCategorias, crearCategoria }
