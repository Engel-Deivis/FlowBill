/**
 * productos.js — Página de gestión del catálogo de productos/servicios
 *
 * CRUD completo de productos: listado con búsqueda, creación, edición y baja.
 * Incluye indicadores visuales de stock (ok / advertencia / agotado).
 *
 * Flujo:
 *   renderProductos() → inyecta productos.html → cargarProductos() → renderTabla()
 *   Búsqueda reactiva en el input (filtra el caché en memoria, sin peticiones extra)
 *   Botón "Nuevo" o click editar → abrirFormProducto(producto?)
 *   Click eliminar → modal.confirm() → api.productos.delete()
 *
 * Seguridad:
 *   - Todos los datos del API se escapan con esc() antes de insertarse en innerHTML.
 *   - Los botones usan data-action + data-id en lugar de onclick con parámetros
 *     para evitar inyección de atributos a través de datos del usuario.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { modal } from '../components/modal.js'
import { esc }   from '../utils.js'

/* HTML base de la página: cabecera, barra de búsqueda y tabla — importado como string. */
import productosHTML from '../../pages/productos.html?raw'

/** Caché de productos actualmente cargados; usado para búsqueda local y lookups. */
let allProductos = []

/**
 * Punto de entrada de la página Productos.
 * Inyecta el HTML base, carga datos y enlaza eventos de UI.
 */
export async function renderProductos() {
  document.getElementById('main').innerHTML = productosHTML

  await cargarProductos()

  // Botón "Nuevo Producto" → abre el modal de creación
  document.getElementById('btn-nuevo-producto').onclick = () => abrirFormProducto()

  // Búsqueda reactiva sobre el caché (nombre o código SKU)
  document.getElementById('search-productos').addEventListener('input', (e) => {
    const t = e.target.value.toLowerCase()
    renderTabla(
      allProductos.filter(p =>
        p.nombre.toLowerCase().includes(t) ||
        (p.codigo || '').toLowerCase().includes(t)
      )
    )
  })
}

/**
 * Carga todos los productos desde el servidor y actualiza el caché y la tabla.
 */
async function cargarProductos() {
  try {
    allProductos = await api.productos.list()
    renderTabla(allProductos)
  } catch {
    toast.error('Error al cargar productos')
  }
}

/**
 * Determina la clase CSS de la celda de stock según el nivel.
 * Regla:
 *   stock === 0          → stock-danger (agotado, crítico)
 *   stock <= stockMinimo → stock-warning (por debajo del mínimo configurado)
 *   stock > stockMinimo  → stock-ok
 *
 * @param {Object} p - Objeto producto
 * @returns {string} Nombre de clase CSS
 */
function stockClass(p) {
  if (p.stock === 0)              return 'stock-danger'
  if (p.stock <= p.stockMinimo)  return 'stock-warning'
  return 'stock-ok'
}

/**
 * Inserta las filas de productos en #productos-tbody.
 * Botones usan delegación de eventos vía data-action + data-id.
 *
 * @param {Array} productos - Lista de productos a mostrar
 */
function renderTabla(productos) {
  const tbody = document.getElementById('productos-tbody')
  if (!tbody) return

  // Estado vacío
  if (!productos.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state"><p>No hay productos registrados</p></div>
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = productos.map(p => `
    <tr>
      <td>
        <div class="td-main">${esc(p.nombre)}</div>
        ${p.descripcion ? `<div class="td-sub">${esc(p.descripcion)}</div>` : ''}
      </td>
      <td>${esc(p.codigo || '—')}</td>
      <td><strong>${fmt(p.precio)}</strong></td>
      <!-- ITBIS almacenado como decimal (0.18 = 18%) -->
      <td>${(parseFloat(p.itbis) * 100).toFixed(0)}%</td>
      <td>
        <span class="${stockClass(p)}">${p.stock} uds</span>
      </td>
      <td>${esc(p.categoria?.nombre || '—')}</td>
      <td class="col-actions">
        <button class="btn-icon" title="Editar"
                data-action="editar"   data-id="${esc(p.id)}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                 m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button class="btn-icon" title="Eliminar"
                data-action="eliminar" data-id="${esc(p.id)}">
          <svg width="15" height="15" fill="none" stroke="var(--danger)" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                 m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('')

  // Un solo listener maneja todos los botones de la tabla
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    if (action === 'editar')   await onEditarProducto(id)
    if (action === 'eliminar') onEliminarProducto(id)
  })
}

/**
 * Abre el modal de formulario para crear o editar un producto.
 * Las categorías se cargan desde el API para poblar el select.
 *
 * @param {Object|null} producto - Objeto producto para edición, o null para crear
 */
async function abrirFormProducto(producto = null) {
  const esEdit     = !!producto
  // Carga categorías disponibles; si falla, el select queda vacío (no crítico)
  const categorias = await api.productos.categorias().catch(() => [])

  const m = modal.create({ title: esEdit ? 'Editar Producto' : 'Nuevo Producto' })

  m.setBody(`
    <form id="form-producto">

      <div class="form-row">
        <div class="form-group">
          <label>Nombre <span class="required">*</span></label>
          <input name="nombre" type="text"
            value="${esc(producto?.nombre || '')}" required />
        </div>
        <div class="form-group">
          <label>Código SKU</label>
          <input name="codigo" type="text"
            value="${esc(producto?.codigo || '')}" placeholder="SKU-001" />
        </div>
      </div>

      <div class="form-group">
        <label>Descripción</label>
        <textarea name="descripcion" rows="2">${esc(producto?.descripcion || '')}</textarea>
      </div>

      <!-- Precio, costo e ITBIS en la misma fila -->
      <div class="form-row-3">
        <div class="form-group">
          <label>Precio (RD$) <span class="required">*</span></label>
          <input name="precio" type="number" step="0.01" min="0"
            value="${esc(producto?.precio || '')}" required />
        </div>
        <div class="form-group">
          <label>Costo (RD$)</label>
          <input name="costo" type="number" step="0.01" min="0"
            value="${esc(producto?.costo || '')}" />
        </div>
        <div class="form-group">
          <label>ITBIS (%)</label>
          <!-- Valores en decimal: 0 = exento, 0.16 = 16%, 0.18 = 18% -->
          <select name="itbis">
            <option value="0"    ${parseFloat(producto?.itbis) === 0    ? 'selected' : ''}>0% — Exento</option>
            <option value="0.16" ${parseFloat(producto?.itbis) === 0.16 ? 'selected' : ''}>16%</option>
            <option value="0.18" ${!producto || parseFloat(producto?.itbis) === 0.18 ? 'selected' : ''}>18%</option>
          </select>
        </div>
      </div>

      <!-- Control de stock -->
      <div class="form-row">
        <div class="form-group">
          <label>Stock inicial</label>
          <input name="stock" type="number" min="0"
            value="${producto?.stock ?? 0}" />
        </div>
        <div class="form-group">
          <label>Stock mínimo</label>
          <!-- Por debajo de este valor se dispara la alerta de stock bajo -->
          <input name="stockMinimo" type="number" min="0"
            value="${producto?.stockMinimo ?? 5}" />
        </div>
      </div>

      <div class="form-group">
        <label>Categoría</label>
        <select name="categoriaId">
          <option value="">Sin categoría</option>
          ${categorias.map(c => `
            <option value="${esc(c.id)}"
              ${producto?.categoriaId === c.id ? 'selected' : ''}>
              ${esc(c.nombre)}
            </option>`).join('')}
        </select>
      </div>

    </form>
  `)

  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-save">
      ${esEdit ? 'Guardar cambios' : 'Crear producto'}
    </button>
  `)
  m.open()

  m.el.querySelector('#mc-cancel').onclick = m.close

  // Guardar: valida, llama API y recarga tabla
  m.el.querySelector('#mc-save').onclick = async () => {
    const form = m.el.querySelector('#form-producto')
    const data = Object.fromEntries(new FormData(form))

    if (!data.nombre || !data.precio) {
      return toast.warning('Nombre y precio son requeridos.')
    }

    try {
      if (esEdit) {
        await api.productos.update(producto.id, data)
        toast.success('Producto actualizado.')
      } else {
        await api.productos.create(data)
        toast.success('Producto creado.')
      }
      m.close()
      await cargarProductos()
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Carga el producto completo desde el servidor y abre el formulario de edición.
 *
 * @param {string} id - UUID del producto
 */
async function onEditarProducto(id) {
  try {
    abrirFormProducto(await api.productos.get(id))
  } catch {
    toast.error('Error al cargar producto')
  }
}

/**
 * Muestra confirmación antes de eliminar. Lee el nombre del caché local.
 *
 * @param {string} id - UUID del producto
 */
function onEliminarProducto(id) {
  const p = allProductos.find(x => x.id === id)
  if (!p) return

  modal.confirm({
    title:   'Eliminar producto',
    message: `¿Deseas eliminar <strong>${esc(p.nombre)}</strong>? Esta acción no se puede deshacer.`,
    danger:  true,
    onConfirm: async () => {
      try {
        await api.productos.delete(id)
        toast.success('Producto eliminado.')
        await cargarProductos()
      } catch (err) {
        toast.error(err.message)
      }
    },
  })
}

/** Formatea un valor como moneda dominicana (RD$). */
const fmt = (v) =>
  new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v)
