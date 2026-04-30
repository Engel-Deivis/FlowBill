const router = require('express').Router()
const { handleLogin, handleRegister, handleMe } = require('./auth.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.post('/login', handleLogin)
router.post('/register', auth, roles('SUPERADMIN', 'ADMIN'), handleRegister)
router.get('/me', auth, handleMe)

module.exports = router