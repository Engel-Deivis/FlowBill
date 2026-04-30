const jwt = require('jsonwebtoken')
const { fail } = require('../utils/response')

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return fail(res, 'Token requerido.', 401)

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    fail(res, 'Token inválido o expirado.', 401)
  }
}