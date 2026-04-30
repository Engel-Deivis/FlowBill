const router = require('express').Router()
const ctrl = require('./ncf.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth)
router.get('/', ctrl.listar)
router.get('/:id', ctrl.obtener)
router.get('/siguiente/:tipoNcf', roles('ADMIN', 'SUPERADMIN', 'CAJERO'), ctrl.siguiente)
router.post('/', roles('ADMIN', 'SUPERADMIN'), ctrl.crear)
router.put('/:id', roles('ADMIN', 'SUPERADMIN'), ctrl.actualizar)

module.exports = router
