require('express-async-errors')
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const errorHandler = require('./middlewares/errorHandler')

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))
app.use(morgan('dev'))
app.use(express.json())

// Strips the /_/backend prefix that Vercel injects in experimentalServices routing
app.use((req, _res, next) => {
  req.url = req.url.replace(/^\/_\/backend/, '') || '/'
  next()
})

app.use('/api/auth', require('./modules/auth/auth.routes'))
app.use('/api/empresas', require('./modules/empresas/empresas.routes'))
app.use('/api/clientes', require('./modules/clientes/clientes.routes'))
app.use('/api/productos', require('./modules/productos/productos.routes'))
app.use('/api/facturas', require('./modules/facturas/facturas.routes'))
app.use('/api/ncf', require('./modules/ncf/ncf.routes'))
app.use('/api/inventario', require('./modules/inventario/inventario.routes'))
app.use('/api/reportes', require('./modules/reportes/reportes.routes'))

app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(errorHandler)

module.exports = app