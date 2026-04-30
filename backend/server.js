require('dotenv').config()
const app = require('./src/app')

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`🚀 FlowBill API corriendo en http://localhost:${PORT}`)
  })
}

module.exports = app
