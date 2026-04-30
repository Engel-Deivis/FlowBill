const router = require('express').Router()
const ctrl = require('./reportes.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth, roles('ADMIN', 'SUPERADMIN'))
router.get('/ventas', ctrl.ventas)
router.get('/ventas-por-dia', ctrl.ventasPorDia)
router.get('/top-clientes', ctrl.topClientes)
router.get('/itbis', ctrl.itbis)
router.get('/inventario', ctrl.inventarioActual)

module.exports = router
