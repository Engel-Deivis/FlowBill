const { fail } = require('../utils/response')

module.exports = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    return fail(res, 'No tienes permisos para esta acción.', 403)
  }
  next()
}