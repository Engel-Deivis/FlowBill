const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../../config/db')
const { fail } = require('../../utils/response')

const login = async (email, password, empresaId) => {
  // Hardcoded Demo Login for Portfolio
  const demoEmpresaId = 'cmokk7nvz0000wiasbcw8887g'
  const demoEmail     = 'admin@flowbill.com'
  const demoPassword  = 'admin123'

  if (email === demoEmail && password === demoPassword && empresaId === demoEmpresaId) {
    const demoUser = {
      id: 'demo-user-id',
      nombre: 'Admin Demo',
      email: demoEmail,
      rol: 'SUPERADMIN',
      empresaId: demoEmpresaId,
      activo: true,
      empresa: { nombre: 'FlowBill Demo', rnc: '123456789' }
    }

    const token = jwt.sign(
      { id: demoUser.id, rol: demoUser.rol, empresaId: demoUser.empresaId },
      process.env.JWT_SECRET || 'flowbill_secret_2024_super_seguro_xk29zp',
      { expiresIn: '7d' }
    )

    return { token, user: demoUser }
  }

  const usuario = await prisma.usuario.findFirst({
    where: { email, empresaId, activo: true },
    include: { empresa: { select: { nombre: true, rnc: true } } },
  })

  if (!usuario) throw { status: 401, message: 'Credenciales incorrectas.' }

  const valid = await bcrypt.compare(password, usuario.password)
  if (!valid) throw { status: 401, message: 'Credenciales incorrectas.' }

  const token = jwt.sign(
    { id: usuario.id, rol: usuario.rol, empresaId: usuario.empresaId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )

  const { password: _, ...user } = usuario
  return { token, user }
}

const register = async (data) => {
  const hash = await bcrypt.hash(data.password, 10)
  return prisma.usuario.create({
    data: { ...data, password: hash },
    select: { id: true, nombre: true, email: true, rol: true, empresaId: true },
  })
}

module.exports = { login, register }