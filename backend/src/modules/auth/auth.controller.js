const { login, register } = require('./auth.service')
const { ok, fail } = require('../../utils/response')

const handleLogin = async (req, res, next) => {
  try {
    const { email, password, empresaId } = req.body
    if (!email || !password || !empresaId) return fail(res, 'email, password y empresaId son requeridos.')
    const result = await login(email, password, empresaId)
    ok(res, result)
  } catch (err) { next(err) }
}

const handleRegister = async (req, res, next) => {
  try {
    const user = await register(req.body)
    ok(res, user, 201)
  } catch (err) { next(err) }
}

const handleMe = (req, res) => ok(res, req.user)

module.exports = { handleLogin, handleRegister, handleMe }