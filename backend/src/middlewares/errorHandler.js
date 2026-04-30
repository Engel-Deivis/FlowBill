const { fail } = require('../utils/response')

module.exports = (err, req, res, next) => {
  console.error(err)

  if (err.code === 'P2002') return fail(res, 'Ya existe un registro con ese valor único.', 409)
  if (err.code === 'P2025') return fail(res, 'Registro no encontrado.', 404)

  fail(res, err.message || 'Error interno del servidor.', err.status || 500)
}