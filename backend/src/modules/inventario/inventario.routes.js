const router = require('express').Router()
const ctrl = require('./inventario.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth)
router.get('/', ctrl.listar)
router.get('/stock-bajo', ctrl.stockBajo)
router.post('/', roles('ADMIN', 'SUPERADMIN'), ctrl.registrar)

module.exports = router
