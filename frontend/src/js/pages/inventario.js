/**
 * inventario.js — Página de movimientos de inventario
 *
 * Registra entradas, salidas y ajustes de stock de productos.
 * También permite consultar el listado de productos con stock bajo.
 *
 * Tipos de movimiento:
 *   ENTRADA — Compra o recepción de mercancía (suma al stock)
 *   SALIDA  — Merma, pérdida o uso interno (resta al stock)
 *   AJUSTE  — Corrección directa: el backend establece el stock exacto indicado
 *
 * Flujo principal:
 *   renderInventario() → inyecta inventario.html → cargarMovimientos()
 *   Botón "Registrar movimiento" → abrirFormMovimiento()
 *   Botón "⚠ Stock bajo"        → modal con lista de productos críticos
 *   Filtro por tipo → cargarMovimientos({ tipo })
 *
 * Seguridad:
 *   - Datos del API escapados con esc() antes de insertar en innerHTML.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { modal } from '../components/modal.js'
import { esc }   from '../utils.js'

/* HTML base de la página — cabecera, filtros y tabla de movimientos. */
import inventarioHTML from '../../pages/inventario.html?raw'

/**
 * Punto de entrada de la página Inventario.
 */
export async function renderInventario() {
  document.getElementById('main').innerHTML = inventarioHTML

  await cargarMovimientos()

  // Botón "Registrar movimiento" → abre modal de formulario
  document.getElementById('btn-nuevo-mov').onclick = () => abrirFormMovimiento()

  // Botón "Filtrar" por tipo de movimiento
  document.getElementById('btn-filtrar').onclick = () => {
    cargarMovimientos({ tipo: document.getElementById('filtro-tipo').value })
  }

  // Botón "⚠ Stock bajo" → muestra modal con productos bajo el mínimo
  document.getElementById('btn-stock-bajo').onclick = async () => {
    try {
      const data = await api.inventario.stockBajo()
      const m = modal.create({ title: 'Productos con stock bajo', size: 'lg' })

      m.setBody(
        data.length === 0
          ? `<div class="empty-state"><p>Todos los productos tienen stock suficiente 👍</p></div>`
          : `<table class="data-table">
               <thead>
                 <tr>
                   <th>Producto</th><th>Código</th>
                   <th>Stock actual</th><th>Stock mínimo</th>
                 </tr>
               </thead>
               <tbody>
                 ${data.map(p => `
                   <tr class="${p.stock === 0 ? 'row-danger' : 'row-warning'}">
                     <td class="td-main">${esc(p.nombre)}</td>
                     <td>${esc(p.codigo || '—')}</td>
                     <td>
                       <strong class="${p.stock === 0 ? 'stock-danger' : 'stock-warning'}">
                         ${p.stock}
                       </strong>
                     </td>
                     <td>${p.stockMinimo}</td>
                   </tr>`).join('')}
               </tbody>
             </table>`
      )
      m.open()
    } catch {
      toast.error('Error al cargar stock bajo')
    }
  }
}

/**
 * Carga los movimientos de inventario con los filtros dados y repinta la tabla.
 *
 * @param {Object} filtros - { tipo?: 'ENTRADA'|'SALIDA'|'AJUSTE' }
 */
async function cargarMovimientos(filtros = {}) {
  try {
    const movs  = await api.inventario.list(filtros)
    const tbody = document.getElementById('inv-tbody')
    if (!tbody) return

    // Estado vacío
    if (!movs.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-state"><p>No hay movimientos registrados</p></div>
          </td>
        </tr>`
      return
    }

    tbody.innerHTML = movs.map(m => `
      <tr>
        <td>
          <div class="td-main">${esc(m.producto?.nombre || '—')}</div>
          <div class="td-sub">${esc(m.producto?.codigo  || '')}</div>
        </td>
        <td>
          <span class="badge badge-${tipoBadge(m.tipo)}">${esc(m.tipo)}</span>
        </td>
        <!-- Signo visual: + para entradas/ajustes, - para salidas -->
        <td>
          <strong>${m.tipo === 'SALIDA' ? '-' : '+'}${m.cantidad}</strong>
        </td>
        <td>${esc(m.motivo || '—')}</td>
        <td>${fmtFecha(m.createdAt)}</td>
      </tr>
    `).join('')
  } catch {
    toast.error('Error al cargar movimientos')
  }
}

/**
 * Abre el modal de registro de un nuevo movimiento de inventario.
 * Carga la lista de productos para el select.
 */
async function abrirFormMovimiento() {
  const productos = await api.productos.list().catch(() => [])
  const m = modal.create({ title: 'Registrar movimiento de inventario' })

  m.setBody(`
    <!-- Producto sobre el que se aplica el movimiento -->
    <div class="form-group">
      <label>Producto <span class="required">*</span></label>
      <select id="mov-producto" required>
        <option value="">Seleccionar producto…</option>
        ${productos.map(p => `
          <option value="${esc(p.id)}">
            ${esc(p.nombre)} (stock: ${p.stock})
          </option>`).join('')}
      </select>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Tipo <span class="required">*</span></label>
        <select id="mov-tipo">
          <option value="ENTRADA">Entrada (compra / recepción)</option>
          <option value="SALIDA">Salida (merma / pérdida)</option>
          <!-- AJUSTE sobreescribe el stock con el valor indicado -->
          <option value="AJUSTE">Ajuste (nuevo stock exacto)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Cantidad <span class="required">*</span></label>
        <input id="mov-cantidad" type="number" min="1" value="1" required />
      </div>
    </div>

    <div class="form-group">
      <label>Motivo</label>
      <input id="mov-motivo" type="text"
        placeholder="Ej: Compra proveedor XYZ, Merma, etc." />
    </div>
  `)

  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-save">Registrar</button>
  `)
  m.open()

  m.el.querySelector('#mc-cancel').onclick = m.close

  // Guardar: valida campos mínimos y envía al backend
  m.el.querySelector('#mc-save').onclick = async () => {
    const productoId = document.getElementById('mov-producto').value
    const tipo       = document.getElementById('mov-tipo').value
    const cantidad   = document.getElementById('mov-cantidad').value
    const motivo     = document.getElementById('mov-motivo').value

    if (!productoId || !cantidad) {
      return toast.warning('Producto y cantidad son requeridos.')
    }

    try {
      await api.inventario.create({ productoId, tipo, cantidad, motivo })
      toast.success('Movimiento registrado.')
      m.close()
      await cargarMovimientos()
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Mapea el tipo de movimiento a una variante de badge CSS.
 *
 * @param {string} t - Tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'
 * @returns {string}
 */
const tipoBadge = (t) =>
  ({ ENTRADA: 'success', SALIDA: 'danger', AJUSTE: 'info' }[t] || 'gray')

/**
 * Formatea una fecha ISO a texto corto con hora, en español dominicano.
 * Ej: "15 abr 2025, 02:30 p. m."
 */
const fmtFecha = (s) =>
  new Date(s).toLocaleDateString('es-DO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
