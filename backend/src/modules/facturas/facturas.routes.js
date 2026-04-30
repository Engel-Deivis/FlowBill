const router = require('express').Router()
const ctrl = require('./facturas.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth)
router.get('/', ctrl.listar)
router.get('/:id', ctrl.obtener)
router.get('/:id/pdf', ctrl.descargarPdf)
router.post('/', ctrl.crear)
router.patch('/:id/estado', roles('ADMIN', 'SUPERADMIN'), ctrl.cambiarEstado)

module.exports = router
