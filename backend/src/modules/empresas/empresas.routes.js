const router = require('express').Router()
const ctrl = require('./empresas.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth)
router.get('/', roles('SUPERADMIN'), ctrl.listar)
router.get('/:id', ctrl.obtener)
router.post('/', roles('SUPERADMIN'), ctrl.crear)
router.put('/:id', roles('SUPERADMIN', 'ADMIN'), ctrl.actualizar)
router.delete('/:id', roles('SUPERADMIN'), ctrl.desactivar)

module.exports = router
