const router = require('express').Router()
const ctrl = require('./productos.controller')
const auth = require('../../middlewares/auth')
const roles = require('../../middlewares/roles')

router.use(auth)
router.get('/categorias', ctrl.listarCategorias)
router.post('/categorias', roles('ADMIN', 'SUPERADMIN'), ctrl.crearCategoria)
router.get('/', ctrl.listar)
router.get('/:id', ctrl.obtener)
router.post('/', roles('ADMIN', 'SUPERADMIN'), ctrl.crear)
router.put('/:id', roles('ADMIN', 'SUPERADMIN'), ctrl.actualizar)
router.delete('/:id', roles('ADMIN', 'SUPERADMIN'), ctrl.eliminar)

module.exports = router
