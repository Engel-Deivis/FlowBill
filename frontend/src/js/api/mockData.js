/**
 * mockData.js — Datos de demo hardcodeados para el portafolio
 * Elimina la dependencia del backend para que reclutadores vean todo funcionando.
 */

const EMPRESA_ID = 'cmokk7nvz0000wiasbcw8887g'

// ── Clientes ──────────────────────────────────────────────────────
let clientes = [
  { id: 'cli-1', nombre: 'Juan García',        cedula: '001-0000001-1', rnc: null, email: 'juan@email.com',   telefono: '809-555-0201', direccion: null, activo: true, empresaId: EMPRESA_ID, createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-01-15T10:00:00Z' },
  { id: 'cli-2', nombre: 'María Rodríguez',    cedula: '001-0000002-2', rnc: null, email: 'maria@email.com',  telefono: '809-555-0202', direccion: null, activo: true, empresaId: EMPRESA_ID, createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-01-20T10:00:00Z' },
  { id: 'cli-3', nombre: 'Empresa ABC S.R.L.', cedula: null, rnc: '101-00001-1', email: 'abc@empresa.com',  telefono: '809-555-0300', direccion: 'Av. 27 de Febrero, SD', activo: true, empresaId: EMPRESA_ID, createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z' },
  { id: 'cli-4', nombre: 'Supermercados XYZ',  cedula: null, rnc: '101-00002-2', email: 'xyz@super.com',    telefono: '809-555-0400', direccion: 'Calle El Conde, ZC', activo: true, empresaId: EMPRESA_ID, createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z' },
  { id: 'cli-5', nombre: 'Carlos Martínez',    cedula: '001-0000003-3', rnc: null, email: 'carlos@email.com', telefono: '809-555-0203', direccion: null, activo: true, empresaId: EMPRESA_ID, createdAt: '2026-03-05T10:00:00Z', updatedAt: '2026-03-05T10:00:00Z' },
]

// ── Categorías ────────────────────────────────────────────────────
let categorias = [
  { id: 'cat-alimentos', nombre: 'Alimentos y Bebidas', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-electro',   nombre: 'Electrónica',         createdAt: '2026-01-01T00:00:00Z' },
  { id: 'cat-servicios', nombre: 'Servicios',            createdAt: '2026-01-01T00:00:00Z' },
]

// ── Productos ─────────────────────────────────────────────────────
let productos = [
  { id: 'prod-TECH-001', nombre: 'Laptop HP 15"',      codigo: 'TECH-001', descripcion: null, precio: 45000, costo: 38000, itbis: 0.18, stock: 12, stockMinimo: 3,  activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-electro',   categoria: { id: 'cat-electro', nombre: 'Electrónica' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-TECH-002', nombre: 'Mouse Inalámbrico',  codigo: 'TECH-002', descripcion: null, precio: 1800,  costo: 1200,  itbis: 0.18, stock: 45, stockMinimo: 10, activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-electro',   categoria: { id: 'cat-electro', nombre: 'Electrónica' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-TECH-003', nombre: 'Teclado USB',        codigo: 'TECH-003', descripcion: null, precio: 2200,  costo: 1500,  itbis: 0.18, stock: 30, stockMinimo: 8,  activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-electro',   categoria: { id: 'cat-electro', nombre: 'Electrónica' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-ALI-001',  nombre: 'Café Premium 250g',  codigo: 'ALI-001',  descripcion: null, precio: 450,   costo: 280,   itbis: 0,    stock: 80, stockMinimo: 20, activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-alimentos', categoria: { id: 'cat-alimentos', nombre: 'Alimentos y Bebidas' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-ALI-002',  nombre: 'Agua Mineral 1L',    codigo: 'ALI-002',  descripcion: null, precio: 65,    costo: 35,    itbis: 0,    stock: 200,stockMinimo: 50, activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-alimentos', categoria: { id: 'cat-alimentos', nombre: 'Alimentos y Bebidas' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-SRV-001',  nombre: 'Servicio de Diseño', codigo: 'SRV-001',  descripcion: null, precio: 15000, costo: 0,     itbis: 0.18, stock: 999,stockMinimo: 0,  activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-servicios', categoria: { id: 'cat-servicios', nombre: 'Servicios' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-SRV-002',  nombre: 'Soporte Técnico/hr', codigo: 'SRV-002',  descripcion: null, precio: 2500,  costo: 0,     itbis: 0.18, stock: 999,stockMinimo: 0,  activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-servicios', categoria: { id: 'cat-servicios', nombre: 'Servicios' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
  { id: 'prod-TECH-004', nombre: 'Monitor 24" FHD',    codigo: 'TECH-004', descripcion: null, precio: 18500, costo: 14000, itbis: 0.18, stock: 8,  stockMinimo: 2,  activo: true, empresaId: EMPRESA_ID, categoriaId: 'cat-electro',   categoria: { id: 'cat-electro', nombre: 'Electrónica' }, createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-01-05T10:00:00Z' },
]

// ── NCF ───────────────────────────────────────────────────────────
let secuenciasNcf = [
  { id: 'ncf-1', tipoNcf: 'B01', prefijo: 'B01', secuenciaMin: 1, secuenciaMax: 500, secuenciaActual: 5, vencimiento: '2027-12-31T00:00:00Z', activa: true, empresaId: EMPRESA_ID, createdAt: '2026-01-01T00:00:00Z' },
  { id: 'ncf-2', tipoNcf: 'B02', prefijo: 'B02', secuenciaMin: 1, secuenciaMax: 500, secuenciaActual: 3, vencimiento: '2027-12-31T00:00:00Z', activa: true, empresaId: EMPRESA_ID, createdAt: '2026-01-01T00:00:00Z' },
]

// ── Facturas ──────────────────────────────────────────────────────
const hoy = new Date()
const hace = (d) => new Date(hoy - d * 86400000).toISOString()

let facturas = [
  { id: 'fac-1', numero: 'FAC-0001', ncf: 'B0100000001', fecha: hace(0), subtotal: 46800, descuento: 0, itbis: 8424, total: 55224, estado: 'PENDIENTE', notas: null, empresaId: EMPRESA_ID, clienteId: 'cli-1', usuarioId: 'demo-user-id', cliente: { nombre: 'Juan García' }, items: [{ id: 'it-1', cantidad: 1, precio: 45000, descuento: 0, itbis: 8100, subtotal: 45000, productoId: 'prod-TECH-001', producto: { nombre: 'Laptop HP 15"' } }, { id: 'it-2', cantidad: 1, precio: 1800, descuento: 0, itbis: 324, subtotal: 1800, productoId: 'prod-TECH-002', producto: { nombre: 'Mouse Inalámbrico' } }], createdAt: hace(0) },
  { id: 'fac-2', numero: 'FAC-0002', ncf: 'B0100000002', fecha: hace(1), subtotal: 15000, descuento: 0, itbis: 2700, total: 17700, estado: 'PAGADA', notas: null, empresaId: EMPRESA_ID, clienteId: 'cli-3', usuarioId: 'demo-user-id', cliente: { nombre: 'Empresa ABC S.R.L.' }, items: [{ id: 'it-3', cantidad: 1, precio: 15000, descuento: 0, itbis: 2700, subtotal: 15000, productoId: 'prod-SRV-001', producto: { nombre: 'Servicio de Diseño' } }], createdAt: hace(1) },
  { id: 'fac-3', numero: 'FAC-0003', ncf: 'B0200000001', fecha: hace(2), subtotal: 2200, descuento: 0, itbis: 396, total: 2596, estado: 'PAGADA', notas: null, empresaId: EMPRESA_ID, clienteId: 'cli-2', usuarioId: 'demo-user-id', cliente: { nombre: 'María Rodríguez' }, items: [{ id: 'it-4', cantidad: 1, precio: 2200, descuento: 0, itbis: 396, subtotal: 2200, productoId: 'prod-TECH-003', producto: { nombre: 'Teclado USB' } }], createdAt: hace(2) },
  { id: 'fac-4', numero: 'FAC-0004', ncf: 'B0100000003', fecha: hace(5), subtotal: 18500, descuento: 0, itbis: 3330, total: 21830, estado: 'PAGADA', notas: null, empresaId: EMPRESA_ID, clienteId: 'cli-4', usuarioId: 'demo-user-id', cliente: { nombre: 'Supermercados XYZ' }, items: [{ id: 'it-5', cantidad: 1, precio: 18500, descuento: 0, itbis: 3330, subtotal: 18500, productoId: 'prod-TECH-004', producto: { nombre: 'Monitor 24" FHD' } }], createdAt: hace(5) },
  { id: 'fac-5', numero: 'FAC-0005', ncf: 'B0200000002', fecha: hace(8), subtotal: 5000, descuento: 0, itbis: 900, total: 5900, estado: 'ANULADA', notas: 'Cancelada por el cliente', empresaId: EMPRESA_ID, clienteId: 'cli-5', usuarioId: 'demo-user-id', cliente: { nombre: 'Carlos Martínez' }, items: [{ id: 'it-6', cantidad: 2, precio: 2500, descuento: 0, itbis: 450, subtotal: 2500, productoId: 'prod-SRV-002', producto: { nombre: 'Soporte Técnico/hr' } }], createdAt: hace(8) },
  { id: 'fac-6', numero: 'FAC-0006', ncf: 'B0100000004', fecha: hace(12), subtotal: 9000, descuento: 0, itbis: 1620, total: 10620, estado: 'PAGADA', notas: null, empresaId: EMPRESA_ID, clienteId: 'cli-1', usuarioId: 'demo-user-id', cliente: { nombre: 'Juan García' }, items: [{ id: 'it-7', cantidad: 5, precio: 1800, descuento: 0, itbis: 1620, subtotal: 9000, productoId: 'prod-TECH-002', producto: { nombre: 'Mouse Inalámbrico' } }], createdAt: hace(12) },
]

// ── Inventario ────────────────────────────────────────────────────
let movimientos = [
  { id: 'mov-1', tipo: 'ENTRADA', cantidad: 10, motivo: 'Compra a proveedor',  empresaId: EMPRESA_ID, productoId: 'prod-TECH-001', producto: { nombre: 'Laptop HP 15"' },      createdAt: hace(15) },
  { id: 'mov-2', tipo: 'ENTRADA', cantidad: 50, motivo: 'Compra a proveedor',  empresaId: EMPRESA_ID, productoId: 'prod-TECH-002', producto: { nombre: 'Mouse Inalámbrico' },  createdAt: hace(14) },
  { id: 'mov-3', tipo: 'SALIDA',  cantidad: 5,  motivo: 'Venta',              empresaId: EMPRESA_ID, productoId: 'prod-TECH-002', producto: { nombre: 'Mouse Inalámbrico' },  createdAt: hace(12) },
  { id: 'mov-4', tipo: 'ENTRADA', cantidad: 100,motivo: 'Compra a proveedor',  empresaId: EMPRESA_ID, productoId: 'prod-ALI-002',  producto: { nombre: 'Agua Mineral 1L' },    createdAt: hace(10) },
  { id: 'mov-5', tipo: 'AJUSTE',  cantidad: -2, motivo: 'Ajuste de inventario',empresaId: EMPRESA_ID, productoId: 'prod-TECH-004', producto: { nombre: 'Monitor 24" FHD' },    createdAt: hace(3) },
]

// ── Helpers ───────────────────────────────────────────────────────
let _counter = 100
const uid = () => `mock-${++_counter}`

function genVentasPorDia(dias) {
  const result = []
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    result.push({ fecha: dateStr, total: Math.floor(Math.random() * 50000) + 5000 })
  }
  return result
}

// ── Mock API (misma firma que el client.js real) ──────────────────
export const mockApi = {

  login: ({ empresaId, email, password }) => {
    if (email === 'admin@flowbill.com' && password === 'admin123' && empresaId === EMPRESA_ID) {
      return { token: 'demo-token-' + Date.now(), user: { id: 'demo-user-id', nombre: 'Admin Demo', email, rol: 'SUPERADMIN', empresaId, empresa: { nombre: 'FlowBill Demo', rnc: '101-50001-1' } } }
    }
    throw { status: 401, message: 'Credenciales incorrectas.' }
  },

  me: () => ({ id: 'demo-user-id', nombre: 'Admin Demo', email: 'admin@flowbill.com', rol: 'SUPERADMIN', empresaId: EMPRESA_ID }),

  empresas: {
    list:   () => [{ id: EMPRESA_ID, nombre: 'FlowBill Demo S.R.L.', rnc: '101-50001-1', direccion: 'Av. Winston Churchill, Santo Domingo', telefono: '809-555-0100', email: 'info@flowbilldemo.com', activa: true }],
    get:    () => ({ id: EMPRESA_ID, nombre: 'FlowBill Demo S.R.L.', rnc: '101-50001-1' }),
    create: (b) => ({ id: uid(), ...b }),
    update: (id, b) => ({ id, ...b }),
    delete: () => ({ ok: true }),
  },

  clientes: {
    list: (search) => {
      if (!search) return [...clientes]
      const s = search.toLowerCase()
      return clientes.filter(c => c.nombre.toLowerCase().includes(s) || (c.cedula||'').includes(s) || (c.rnc||'').includes(s))
    },
    get:    (id) => clientes.find(c => c.id === id) || clientes[0],
    create: (b) => { const c = { id: uid(), activo: true, empresaId: EMPRESA_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...b }; clientes.push(c); return c },
    update: (id, b) => { const i = clientes.findIndex(c => c.id === id); if (i >= 0) { clientes[i] = { ...clientes[i], ...b, updatedAt: new Date().toISOString() }; return clientes[i] } return b },
    delete: (id) => { clientes = clientes.filter(c => c.id !== id); return { ok: true } },
  },

  productos: {
    list: (search) => {
      if (!search) return [...productos]
      const s = search.toLowerCase()
      return productos.filter(p => p.nombre.toLowerCase().includes(s) || (p.codigo||'').toLowerCase().includes(s))
    },
    get:            (id) => productos.find(p => p.id === id) || productos[0],
    create:         (b) => { const p = { id: uid(), activo: true, empresaId: EMPRESA_ID, categoria: categorias.find(c => c.id === b.categoriaId) || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...b }; productos.push(p); return p },
    update:         (id, b) => { const i = productos.findIndex(p => p.id === id); if (i >= 0) { productos[i] = { ...productos[i], ...b, categoria: categorias.find(c => c.id === (b.categoriaId || productos[i].categoriaId)) || productos[i].categoria, updatedAt: new Date().toISOString() }; return productos[i] } return b },
    delete:         (id) => { productos = productos.filter(p => p.id !== id); return { ok: true } },
    categorias:     () => [...categorias],
    crearCategoria: (b) => { const c = { id: uid(), createdAt: new Date().toISOString(), ...b }; categorias.push(c); return c },
  },

  facturas: {
    list:   (q = {}) => { let f = [...facturas]; if (q.estado) f = f.filter(x => x.estado === q.estado); return f },
    get:    (id) => facturas.find(f => f.id === id) || facturas[0],
    create: (b) => {
      const num = `FAC-${String(facturas.length + 1).padStart(4, '0')}`
      const f = { id: uid(), numero: num, ncf: `B01${String(facturas.length + 1).padStart(8, '0')}`, fecha: new Date().toISOString(), estado: 'PENDIENTE', empresaId: EMPRESA_ID, usuarioId: 'demo-user-id', cliente: clientes.find(c => c.id === b.clienteId) || { nombre: 'Consumidor final' }, createdAt: new Date().toISOString(), ...b }
      facturas.unshift(f); return f
    },
    estado: (id, estado) => { const f = facturas.find(x => x.id === id); if (f) f.estado = estado; return f },
    pdf:    async () => { alert('📄 Descarga de PDF no disponible en modo demo.') },
  },

  ncf: {
    list:   () => [...secuenciasNcf],
    create: (b) => { const n = { id: uid(), secuenciaActual: 0, activa: true, empresaId: EMPRESA_ID, createdAt: new Date().toISOString(), ...b }; secuenciasNcf.push(n); return n },
    update: (id, b) => { const i = secuenciasNcf.findIndex(n => n.id === id); if (i >= 0) { secuenciasNcf[i] = { ...secuenciasNcf[i], ...b }; return secuenciasNcf[i] } return b },
  },

  inventario: {
    list:      (q = {}) => { let m = [...movimientos]; if (q.tipo) m = m.filter(x => x.tipo === q.tipo); return m },
    create:    (b) => { const m = { id: uid(), empresaId: EMPRESA_ID, producto: productos.find(p => p.id === b.productoId) || { nombre: '?' }, createdAt: new Date().toISOString(), ...b }; movimientos.unshift(m); return m },
    stockBajo: () => productos.filter(p => p.stock <= p.stockMinimo && p.stockMinimo > 0),
  },

  reportes: {
    ventas: () => {
      const validas = facturas.filter(f => f.estado !== 'ANULADA')
      const totalVentas = validas.reduce((s, f) => s + parseFloat(f.total || 0), 0)
      const itbis = validas.reduce((s, f) => s + parseFloat(f.itbis || 0), 0)
      const descuentos = validas.reduce((s, f) => s + parseFloat(f.descuento || 0), 0)
      return { resumen: { totalVentas, itbis, descuentos, totalFacturas: validas.length }, facturas: validas }
    },
    ventasPorDia: (dias) => genVentasPorDia(dias || 30),
    topClientes:  () => {
      const map = {}
      facturas.filter(f => f.estado !== 'ANULADA').forEach(f => {
        const n = f.cliente?.nombre || 'Consumidor final'
        map[n] = (map[n] || 0) + parseFloat(f.total || 0)
      })
      return Object.entries(map).map(([nombre, totalCompras]) => ({ nombre, totalCompras })).sort((a, b) => b.totalCompras - a.totalCompras)
    },
    itbis: () => {
      const validas = facturas.filter(f => f.estado !== 'ANULADA')
      return { total: validas.reduce((s, f) => s + parseFloat(f.itbis || 0), 0), facturas: validas }
    },
    inventario: () => productos.map(p => ({ id: p.id, nombre: p.nombre, codigo: p.codigo, stock: p.stock, stockMinimo: p.stockMinimo, precio: p.precio, costo: p.costo, categoria: p.categoria?.nombre || 'Sin categoría' })),
  },

  // Atajos genéricos (para llamadas ad-hoc)
  get:    () => ({}),
  post:   () => ({}),
  put:    () => ({}),
  patch:  () => ({}),
  delete: () => ({}),
}
