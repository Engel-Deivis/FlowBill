const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Creando datos de demo...')

  // Empresa demo
  const empresa = await prisma.empresa.upsert({
    where: { rnc: '101-50001-1' },
    update: {},
    create: {
      nombre:   'FlowBill Demo S.R.L.',
      rnc:      '101-50001-1',
      direccion:'Av. Winston Churchill, Santo Domingo',
      telefono: '809-555-0100',
      email:    'info@flowbilldemo.com',
      activa:   true,
    },
  })
  console.log(`✅ Empresa: ${empresa.nombre} (ID: ${empresa.id})`)

  // Admin
  const hash = await bcrypt.hash('admin123', 10)
  const admin = await prisma.usuario.upsert({
    where: { email_empresaId: { email: 'admin@flowbill.com', empresaId: empresa.id } },
    update: {},
    create: {
      nombre:    'Administrador',
      email:     'admin@flowbill.com',
      password:  hash,
      rol:       'ADMIN',
      empresaId: empresa.id,
    },
  })
  console.log(`✅ Admin: ${admin.email}`)

  // Cajero
  const cajero = await prisma.usuario.upsert({
    where: { email_empresaId: { email: 'cajero@flowbill.com', empresaId: empresa.id } },
    update: {},
    create: {
      nombre:    'Cajero Demo',
      email:     'cajero@flowbill.com',
      password:  hash,
      rol:       'CAJERO',
      empresaId: empresa.id,
    },
  })
  console.log(`✅ Cajero: ${cajero.email}`)

  // Categorías
  const cats = await Promise.all([
    prisma.categoria.upsert({ where: { id: 'cat-alimentos' }, update: {}, create: { id: 'cat-alimentos', nombre: 'Alimentos y Bebidas' } }),
    prisma.categoria.upsert({ where: { id: 'cat-electro' },   update: {}, create: { id: 'cat-electro',   nombre: 'Electrónica' } }),
    prisma.categoria.upsert({ where: { id: 'cat-servicios' }, update: {}, create: { id: 'cat-servicios', nombre: 'Servicios' } }),
  ])
  console.log('✅ Categorías creadas')

  // Productos demo
  const productos = [
    { nombre: 'Laptop HP 15"',       codigo: 'TECH-001', precio: 45000, costo: 38000, itbis: 0.18, stock: 12, stockMinimo: 3,  categoriaId: cats[1].id },
    { nombre: 'Mouse Inalámbrico',   codigo: 'TECH-002', precio: 1800,  costo: 1200,  itbis: 0.18, stock: 45, stockMinimo: 10, categoriaId: cats[1].id },
    { nombre: 'Teclado USB',         codigo: 'TECH-003', precio: 2200,  costo: 1500,  itbis: 0.18, stock: 30, stockMinimo: 8,  categoriaId: cats[1].id },
    { nombre: 'Café Premium 250g',   codigo: 'ALI-001',  precio: 450,   costo: 280,   itbis: 0,    stock: 80, stockMinimo: 20, categoriaId: cats[0].id },
    { nombre: 'Agua Mineral 1L',     codigo: 'ALI-002',  precio: 65,    costo: 35,    itbis: 0,    stock: 200,stockMinimo: 50, categoriaId: cats[0].id },
    { nombre: 'Servicio de Diseño',  codigo: 'SRV-001',  precio: 15000, costo: 0,     itbis: 0.18, stock: 999,stockMinimo: 0,  categoriaId: cats[2].id },
    { nombre: 'Soporte Técnico/hr',  codigo: 'SRV-002',  precio: 2500,  costo: 0,     itbis: 0.18, stock: 999,stockMinimo: 0,  categoriaId: cats[2].id },
    { nombre: 'Monitor 24" FHD',     codigo: 'TECH-004', precio: 18500, costo: 14000, itbis: 0.18, stock: 8,  stockMinimo: 2,  categoriaId: cats[1].id },
  ]

  for (const p of productos) {
    await prisma.producto.upsert({
      where: { id: `prod-${p.codigo}` },
      update: {},
      create: { id: `prod-${p.codigo}`, empresaId: empresa.id, ...p },
    })
  }
  console.log('✅ Productos creados')

  // Clientes demo
  const clientes = [
    { nombre: 'Juan García',          cedula: '001-0000001-1', email: 'juan@email.com',   telefono: '809-555-0201' },
    { nombre: 'María Rodríguez',      cedula: '001-0000002-2', email: 'maria@email.com',  telefono: '809-555-0202' },
    { nombre: 'Empresa ABC S.R.L.',   rnc: '101-00001-1',      email: 'abc@empresa.com',  telefono: '809-555-0300' },
    { nombre: 'Supermercados XYZ',    rnc: '101-00002-2',      email: 'xyz@super.com',    telefono: '809-555-0400' },
    { nombre: 'Carlos Martínez',      cedula: '001-0000003-3', email: 'carlos@email.com', telefono: '809-555-0203' },
  ]

  for (let i = 0; i < clientes.length; i++) {
    await prisma.cliente.upsert({
      where: { id: `cli-${i + 1}` },
      update: {},
      create: { id: `cli-${i + 1}`, empresaId: empresa.id, ...clientes[i] },
    })
  }
  console.log('✅ Clientes creados')

  // Secuencia NCF demo
  await prisma.secuenciaNcf.upsert({
    where: { empresaId_tipoNcf: { empresaId: empresa.id, tipoNcf: 'B02' } },
    update: {},
    create: {
      tipoNcf:         'B02',
      prefijo:         'B02',
      secuenciaMin:    1,
      secuenciaMax:    500,
      secuenciaActual: 0,
      vencimiento:     new Date('2027-12-31'),
      empresaId:       empresa.id,
    },
  })
  await prisma.secuenciaNcf.upsert({
    where: { empresaId_tipoNcf: { empresaId: empresa.id, tipoNcf: 'B01' } },
    update: {},
    create: {
      tipoNcf:         'B01',
      prefijo:         'B01',
      secuenciaMin:    1,
      secuenciaMax:    500,
      secuenciaActual: 0,
      vencimiento:     new Date('2027-12-31'),
      empresaId:       empresa.id,
    },
  })
  console.log('✅ Secuencias NCF creadas')

  console.log('\n🎉 ¡Seed completado!')
  console.log('─────────────────────────────────────')
  console.log(`  ID Empresa : ${empresa.id}`)
  console.log('  Email      : admin@flowbill.com')
  console.log('  Contraseña : admin123')
  console.log('─────────────────────────────────────')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
