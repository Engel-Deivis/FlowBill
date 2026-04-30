/**
 * facturas.js — Página de gestión de facturas
 *
 * Módulo más complejo del sistema: permite crear facturas con múltiples ítems,
 * aplicar descuentos, asignar NCF, cambiar estados y descargar PDF.
 *
 * Flujo principal:
 *   renderFacturas() → inyecta facturas.html → cargarFacturas() → renderTabla()
 *   Filtros (estado, fecha) → cargarFacturas(filtros)
 *   "Nueva Factura" → abrirFormFactura() (modal XL con tabla de ítems)
 *   Botón "Ver" → verFactura(id)   | Botón "PDF" → descargarPdf(id, numero)
 *   Botón "Estado" → cambiarEstadoFactura(id, estadoActual)
 *
 * Seguridad:
 *   - Datos del API escapados con esc() antes de insertar en innerHTML.
 *   - Los botones usan data-id + data-action para evitar inyección de atributos.
 *   - El índice de ítem en window.updateItem / window.removeItem es numérico
 *     (parseFloat) — no se interpola como HTML.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { modal } from '../components/modal.js'
import { esc }   from '../utils.js'

/* HTML base de la página — tabla de facturas con filtros. */
import facturasHTML from '../../pages/facturas.html?raw'

/**
 * Punto de entrada de la página Facturas.
 * Inyecta el HTML, carga las facturas y enlaza los filtros.
 */
export async function renderFacturas() {
  document.getElementById('main').innerHTML = facturasHTML

  await cargarFacturas()

  // Botón "Nueva Factura"
  document.getElementById('btn-nueva-factura').onclick = () => abrirFormFactura()

  // Botón "Filtrar" — lee los tres filtros y recarga desde el servidor
  document.getElementById('btn-filtrar').onclick = () => {
    const estado = document.getElementById('filtro-estado').value
    const desde  = document.getElementById('filtro-desde').value
    const hasta  = document.getElementById('filtro-hasta').value
    cargarFacturas({ estado, desde, hasta })
  }
}

/**
 * Carga facturas desde el servidor aplicando los filtros indicados.
 * Los filtros vacíos son ignorados por el backend.
 *
 * @param {Object} filtros - { estado?, desde?, hasta? }
 */
async function cargarFacturas(filtros = {}) {
  try {
    const facturas = await api.facturas.list(filtros)
    renderTabla(facturas)
  } catch {
    toast.error('Error al cargar facturas')
  }
}

/**
 * Mapea el estado de una factura a la variante de badge CSS correspondiente.
 *
 * @param {string} estado
 * @returns {string} Variante: 'warning' | 'success' | 'danger' | 'gray'
 */
const estadoBadge = (e) =>
  ({ PENDIENTE: 'warning', PAGADA: 'success', ANULADA: 'danger' }[e] || 'gray')

/**
 * Renderiza las filas de facturas en #facturas-tbody.
 * Botones de acción usan data-* para delegación de eventos.
 *
 * @param {Array} facturas
 */
function renderTabla(facturas) {
  const tbody = document.getElementById('facturas-tbody')
  if (!tbody) return

  // Estado vacío
  if (!facturas.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state"><p>No hay facturas</p></div>
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = facturas.map(f => `
    <tr>
      <td><strong style="color:var(--primary)">${esc(f.numero)}</strong></td>
      <td>
        <span style="font-size:.8rem;font-family:monospace">
          ${esc(f.ncf || '—')}
        </span>
      </td>
      <td>${esc(f.cliente?.nombre || 'Consumidor final')}</td>
      <td>${fmtFecha(f.fecha)}</td>
      <td><strong>${fmt(f.total)}</strong></td>
      <td><span class="badge badge-${estadoBadge(f.estado)}">${esc(f.estado)}</span></td>
      <td class="col-actions">
        <button class="btn-icon" title="Ver detalle"
                data-action="ver" data-id="${esc(f.id)}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7
                 -1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
        <button class="btn-icon" title="Descargar PDF"
                data-action="pdf" data-id="${esc(f.id)}" data-numero="${esc(f.numero)}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586
                 a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </button>
        ${f.estado !== 'ANULADA' ? `
          <button class="btn-icon" title="Cambiar estado"
                  data-action="estado" data-id="${esc(f.id)}" data-estado="${esc(f.estado)}">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581
                   m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>` : ''}
      </td>
    </tr>
  `).join('')

  // Delegación de eventos: un listener maneja ver / pdf / estado
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id, numero, estado } = btn.dataset
    if (action === 'ver')    verFactura(id)
    if (action === 'pdf')    descargarPdf(id, numero)
    if (action === 'estado') cambiarEstadoFactura(id, estado)
  })
}

/**
 * Abre el modal de creación de nueva factura.
 * Carga la lista de clientes y productos para los selects.
 * Mantiene un array `items` local que se actualiza con cada cambio.
 */
async function abrirFormFactura() {
  // Carga paralela de clientes y productos para poblar los selects
  const [clientes, productos] = await Promise.all([
    api.clientes.list().catch(() => []),
    api.productos.list().catch(() => []),
  ])

  const m = modal.create({ title: 'Nueva Factura', size: 'xl' })

  m.setBody(`
    <!-- Selector de cliente y tipo NCF -->
    <div class="form-row">
      <div class="form-group">
        <label>Cliente</label>
        <select id="f-cliente">
          <option value="">Consumidor final</option>
          ${clientes.map(c => `
            <option value="${esc(c.id)}">
              ${esc(c.nombre)} ${c.rnc ? `(RNC: ${esc(c.rnc)})` : ''}
            </option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Tipo NCF</label>
        <select id="f-ncf">
          <option value="">Sin NCF</option>
          <option value="B01">B01 — Crédito Fiscal</option>
          <option value="B02">B02 — Consumo</option>
          <option value="B14">B14 — Régimen Especial</option>
          <option value="B15">B15 — Gubernamental</option>
          <option value="B16">B16 — Exportaciones</option>
        </select>
      </div>
    </div>

    <!-- Selector de producto para agregar a la factura -->
    <div class="form-group" style="margin-top:4px">
      <label>Buscar y agregar producto</label>
      <div style="display:flex;gap:8px">
        <select id="f-prod-select" style="flex:1">
          <option value="">Seleccionar producto…</option>
          ${productos.map(p => `
            <option value="${esc(p.id)}"
              data-precio="${esc(p.precio)}"
              data-nombre="${esc(p.nombre)}"
              data-itbis="${esc(p.itbis)}">
              ${esc(p.nombre)} — ${fmt(p.precio)} (stock: ${p.stock})
            </option>`).join('')}
        </select>
        <button class="btn btn-secondary" id="btn-add-item">+ Agregar</button>
      </div>
    </div>

    <!-- Tabla de ítems de la factura -->
    <div class="items-table-wrap">
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:35%">Producto</th>
            <th style="width:10%">Cant.</th>
            <th style="width:15%">Precio unit.</th>
            <th style="width:12%">Descuento</th>
            <th style="width:13%">ITBIS</th>
            <th style="width:13%">Subtotal</th>
            <th style="width:2%"></th>
          </tr>
        </thead>
        <tbody id="items-tbody">
          <tr id="empty-items-row">
            <td colspan="7" style="text-align:center;color:var(--gray-400);padding:16px;font-size:.85rem">
              Agrega productos a la factura
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Descuento global + notas + resumen de totales -->
    <div style="display:flex;gap:16px;align-items:flex-start">
      <div style="flex:1">
        <div class="form-group">
          <label>Descuento global (RD$)</label>
          <input id="f-descuento" type="number" min="0" step="0.01" value="0" />
        </div>
        <div class="form-group">
          <label>Notas</label>
          <textarea id="f-notas" rows="2" placeholder="Observaciones opcionales…"></textarea>
        </div>
      </div>
      <div class="totales-box" style="min-width:240px">
        <div class="totales-row"><span>Subtotal:</span>  <span id="t-subtotal">RD$0.00</span></div>
        <div class="totales-row"><span>Descuento:</span> <span id="t-descuento">-RD$0.00</span></div>
        <div class="totales-row"><span>ITBIS:</span>     <span id="t-itbis">RD$0.00</span></div>
        <div class="totales-row total"><span>TOTAL:</span><span id="t-total">RD$0.00</span></div>
      </div>
    </div>
  `)

  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-save">Crear factura</button>
  `)
  m.open()

  /** Array mutable de ítems de la factura (estado local del modal). */
  let items = []

  /**
   * Recalcula subtotal, ITBIS y total y actualiza los spans del resumen.
   * Se llama después de cada cambio en la tabla de ítems.
   */
  const recalcular = () => {
    const desc = parseFloat(document.getElementById('f-descuento')?.value || 0)
    let sub = 0, itb = 0
    items.forEach(it => {
      const base = it.precio * it.cantidad - it.descuento
      itb += base * it.itbis
      sub += base
    })
    const total = Math.max(0, sub + itb - desc)
    document.getElementById('t-subtotal').textContent  = fmt(sub)
    document.getElementById('t-descuento').textContent = `-${fmt(desc)}`
    document.getElementById('t-itbis').textContent     = fmt(itb)
    document.getElementById('t-total').textContent     = fmt(total)
  }

  /**
   * Repinta la tabla de ítems y recalcula totales.
   * Usa índice numérico en data-idx para updateItem / removeItem.
   */
  const renderItems = () => {
    const tbody    = document.getElementById('items-tbody')
    const emptyRow = document.getElementById('empty-items-row')
    if (!items.length) {
      if (emptyRow) emptyRow.style.display = ''
      return
    }
    if (emptyRow) emptyRow.style.display = 'none'

    // Los inputs de cantidad/precio/descuento usan data-idx + data-field
    // para la delegación de eventos (evita window.* globals)
    tbody.innerHTML = items.map((it, i) => `
      <tr>
        <td>${esc(it.nombre)}</td>
        <td>
          <input type="number" min="1" value="${it.cantidad}" style="width:60px"
                 data-idx="${i}" data-field="cantidad" />
        </td>
        <td>
          <input type="number" min="0" step="0.01" value="${it.precio}" style="width:80px"
                 data-idx="${i}" data-field="precio" />
        </td>
        <td>
          <input type="number" min="0" step="0.01" value="${it.descuento}" style="width:70px"
                 data-idx="${i}" data-field="descuento" />
        </td>
        <td>${(it.itbis * 100).toFixed(0)}%</td>
        <td>${fmt((it.precio * it.cantidad - it.descuento) * (1 + it.itbis))}</td>
        <td>
          <button class="btn-icon" data-remove="${i}">✕</button>
        </td>
      </tr>
    `).join('')
    recalcular()

    // Actualiza campo numérico al cambiar input
    tbody.querySelectorAll('input[data-field]').forEach(inp => {
      inp.addEventListener('change', () => {
        const idx   = parseInt(inp.dataset.idx)
        const field = inp.dataset.field
        items[idx][field] = parseFloat(inp.value) || 0
        renderItems()
      })
    })

    // Elimina ítem al hacer click en el botón ✕
    tbody.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        items.splice(parseInt(btn.dataset.remove), 1)
        renderItems()
      })
    })
  }

  // Agregar producto seleccionado a la lista de ítems
  document.getElementById('btn-add-item').onclick = () => {
    const sel = document.getElementById('f-prod-select')
    if (!sel.value) return
    const opt = sel.options[sel.selectedIndex]
    items.push({
      productoId: sel.value,
      nombre:     opt.dataset.nombre,  // ya escapado en el data-attribute
      precio:     parseFloat(opt.dataset.precio),
      cantidad:   1,
      descuento:  0,
      itbis:      parseFloat(opt.dataset.itbis),
    })
    renderItems()
  }

  // Recalcular al cambiar el descuento global
  document.getElementById('f-descuento')?.addEventListener('input', recalcular)

  m.el.querySelector('#mc-cancel').onclick = m.close

  // Crear factura — valida y envía al backend
  m.el.querySelector('#mc-save').onclick = async () => {
    if (!items.length) return toast.warning('Agrega al menos un producto.')

    const body = {
      clienteId:       document.getElementById('f-cliente').value || null,
      tipoNcf:         document.getElementById('f-ncf').value     || null,
      descuentoGlobal: parseFloat(document.getElementById('f-descuento').value) || 0,
      notas:           document.getElementById('f-notas').value,
      items: items.map(it => ({
        productoId: it.productoId,
        cantidad:   it.cantidad,
        precio:     it.precio,
        descuento:  it.descuento,
      })),
    }

    try {
      await api.facturas.create(body)
      toast.success('Factura creada correctamente.')
      m.close()
      await cargarFacturas()
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Abre un modal de solo lectura con el detalle completo de una factura.
 *
 * @param {string} id - UUID de la factura
 */
async function verFactura(id) {
  try {
    const f = await api.facturas.get(id)
    const m = modal.create({ title: `Factura ${esc(f.numero)}`, size: 'lg' })

    m.setBody(`
      <!-- Cabecera: cliente + estado + fecha -->
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div>
          <p class="text-sm text-gray">Cliente</p>
          <p class="font-semibold">${esc(f.cliente?.nombre || 'Consumidor final')}</p>
          ${f.ncf ? `<p class="text-sm text-gray">NCF: <strong>${esc(f.ncf)}</strong></p>` : ''}
        </div>
        <div style="text-align:right">
          <span class="badge badge-${estadoBadge(f.estado)}">${esc(f.estado)}</span>
          <p class="text-sm text-gray mt-4">${fmtFecha(f.fecha)}</p>
        </div>
      </div>

      <!-- Tabla de ítems -->
      <table class="data-table" style="margin-bottom:16px">
        <thead>
          <tr>
            <th>Producto</th><th>Cant.</th><th>Precio</th><th>ITBIS</th><th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${f.items.map(it => `
            <tr>
              <td>${esc(it.producto.nombre)}</td>
              <td>${it.cantidad}</td>
              <td>${fmt(it.precio)}</td>
              <td>${fmt(it.itbis)}</td>
              <td>${fmt(it.subtotal)}</td>
            </tr>`).join('')}
        </tbody>
      </table>

      <!-- Totales -->
      <div class="totales-box">
        <div class="totales-row"><span>Subtotal:</span><span>${fmt(f.subtotal)}</span></div>
        <div class="totales-row"><span>ITBIS:</span>   <span>${fmt(f.itbis)}</span></div>
        <div class="totales-row total"><span>TOTAL:</span><span>${fmt(f.total)}</span></div>
      </div>
    `)

    m.appendFooter(`
      <button class="btn btn-secondary" id="btn-pdf-modal">Descargar PDF</button>
      <button class="btn btn-secondary" id="btn-cerrar-modal">Cerrar</button>
    `)
    m.open()

    m.el.querySelector('#btn-pdf-modal').onclick  = () => descargarPdf(f.id, f.numero)
    m.el.querySelector('#btn-cerrar-modal').onclick = m.close
  } catch {
    toast.error('Error al cargar factura')
  }
}

/**
 * Abre un modal para cambiar el estado de una factura (PENDIENTE / PAGADA / ANULADA).
 * El estado "ANULADA" no permite volver a otro estado (restricción del backend).
 *
 * @param {string} id           - UUID de la factura
 * @param {string} estadoActual - Estado actual de la factura
 */
function cambiarEstadoFactura(id, estadoActual) {
  // Excluye el estado actual de las opciones para no hacer un cambio vacío
  const opciones = ['PENDIENTE', 'PAGADA', 'ANULADA'].filter(e => e !== estadoActual)

  const m = modal.create({ title: 'Cambiar estado' })
  m.setBody(`
    <p class="text-sm text-gray" style="margin-bottom:16px">
      Estado actual: <strong>${esc(estadoActual)}</strong>
    </p>
    <div class="form-group">
      <label>Nuevo estado</label>
      <select id="nuevo-estado">
        ${opciones.map(o => `<option value="${esc(o)}">${esc(o)}</option>`).join('')}
      </select>
    </div>
  `)
  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-ok">Aplicar</button>
  `)
  m.open()

  m.el.querySelector('#mc-cancel').onclick = m.close

  m.el.querySelector('#mc-ok').onclick = async () => {
    const estado = document.getElementById('nuevo-estado').value
    try {
      await api.facturas.estado(id, estado)
      toast.success(`Factura marcada como ${estado}.`)
      m.close()
      await cargarFacturas()
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Descarga el PDF de la factura usando la API (fetch → Blob → anchor click).
 *
 * @param {string} id     - UUID de la factura
 * @param {string} numero - Número de factura para el nombre del archivo descargado
 */
async function descargarPdf(id, numero) {
  try {
    toast.info('Generando PDF…')
    await api.facturas.pdf(id, numero)
  } catch (err) {
    toast.error('Error al generar PDF: ' + err.message)
  }
}

/** Formatea un valor como moneda dominicana (RD$). */
const fmt      = (v) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v)

/** Formatea una fecha ISO a texto legible en español dominicano. */
const fmtFecha = (s) =>
  new Date(s).toLocaleDateString('es-DO', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
