/**
 * clientes.js — Página de gestión de clientes
 *
 * Permite listar, buscar, crear, editar y eliminar clientes de la empresa.
 * El filtrado de búsqueda es local (filtra el array en memoria) para respuesta
 * instantánea sin peticiones extra al servidor.
 *
 * Flujo:
 *   renderClientes() → inyecta clientes.html → cargarClientes() → renderTabla()
 *   Botón "Nuevo" o click en editar → abrirFormCliente(cliente?)
 *   Click en eliminar → modal.confirm() → api.clientes.delete()
 *
 * Seguridad:
 *   - Datos de API escapados con esc() antes de insertarse en innerHTML.
 *   - Los botones de acción usan data-id (UUID) en lugar de pasar el nombre
 *     del cliente como argumento onclick para evitar inyección de atributos.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { modal } from '../components/modal.js'
import { esc }   from '../utils.js'

/* Estructura HTML de la página — importada como texto plano por Vite (?raw).
   Contiene: cabecera, barra de búsqueda y tabla vacía con spinner inicial. */
import clientesHTML from '../../pages/clientes.html?raw'

/** Caché de todos los clientes cargados; usado para el filtrado local. */
let allClientes = []

/**
 * Punto de entrada de la página Clientes.
 * Inyecta el HTML base, carga datos del servidor y enlaza eventos de UI.
 */
export async function renderClientes() {
  document.getElementById('main').innerHTML = clientesHTML

  await cargarClientes()

  // Botón "Nuevo Cliente" → abre el modal de creación
  document.getElementById('btn-nuevo-cliente').onclick = () => abrirFormCliente()

  // Búsqueda reactiva: filtra el array en memoria en cada tecla (sin llamadas al API)
  document.getElementById('search-clientes').addEventListener('input', (e) => {
    filtrarClientes(e.target.value)
  })
}

/**
 * Solicita la lista completa de clientes al backend y la guarda en caché.
 * Si la petición falla, muestra un toast de error y deja la tabla en su estado actual.
 */
async function cargarClientes() {
  try {
    allClientes = await api.clientes.list()
    renderTabla(allClientes)
  } catch {
    toast.error('Error al cargar clientes')
  }
}

/**
 * Filtra el caché `allClientes` por el término ingresado y repinta la tabla.
 * Busca coincidencias en nombre, RNC, cédula y email (insensible a mayúsculas).
 *
 * @param {string} term - Texto del campo de búsqueda
 */
function filtrarClientes(term) {
  if (!term) return renderTabla(allClientes)
  const t = term.toLowerCase()
  renderTabla(allClientes.filter(c =>
    c.nombre.toLowerCase().includes(t)          ||
    (c.rnc    || '').includes(t)                 ||
    (c.cedula || '').includes(t)                 ||
    (c.email  || '').toLowerCase().includes(t)
  ))
}

/**
 * Renderiza las filas de la tabla de clientes en #clientes-tbody.
 * Los botones usan data-id y data-action en lugar de onclick con parámetros
 * para no inyectar datos del usuario en atributos HTML.
 *
 * @param {Array} clientes - Subconjunto de allClientes a mostrar
 */
function renderTabla(clientes) {
  const tbody = document.getElementById('clientes-tbody')
  if (!tbody) return

  // Estado vacío: no hay clientes o no hay resultados de búsqueda
  if (!clientes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="empty-state"><p>No hay clientes registrados</p></div>
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>
        <div class="td-main">${esc(c.nombre)}</div>
        ${c.direccion ? `<div class="td-sub">${esc(c.direccion)}</div>` : ''}
      </td>
      <td>${esc(c.rnc || c.cedula || '—')}</td>
      <td>${esc(c.telefono || '—')}</td>
      <td>${esc(c.email    || '—')}</td>
      <td class="col-actions">
        <!-- data-id contiene el UUID; el nombre lo lee JS desde allClientes -->
        <button class="btn-icon" title="Editar"
                data-action="editar"   data-id="${esc(c.id)}">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                 m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>
        <button class="btn-icon" title="Eliminar"
                data-action="eliminar" data-id="${esc(c.id)}">
          <svg width="15" height="15" fill="none" stroke="var(--danger)" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7
                 m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </td>
    </tr>
  `).join('')

  // Delegación de eventos: un listener en tbody maneja todos los botones
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    if (action === 'editar')   await onEditarCliente(id)
    if (action === 'eliminar') onEliminarCliente(id)
  })
}

/**
 * Abre el modal de formulario para crear o editar un cliente.
 *
 * @param {Object|null} cliente - Objeto cliente para pre-rellenar el form, o null para crear
 */
function abrirFormCliente(cliente = null) {
  const esEdit = !!cliente
  const m = modal.create({ title: esEdit ? 'Editar Cliente' : 'Nuevo Cliente' })

  m.setBody(`
    <form id="form-cliente">

      <div class="form-group">
        <label>Nombre completo <span class="required">*</span></label>
        <input name="nombre" type="text"
          value="${esc(cliente?.nombre || '')}" required />
      </div>

      <!-- RNC para empresas, cédula para personas físicas -->
      <div class="form-row">
        <div class="form-group">
          <label>RNC</label>
          <input name="rnc" type="text"
            value="${esc(cliente?.rnc || '')}" placeholder="000-00000-0" />
        </div>
        <div class="form-group">
          <label>Cédula</label>
          <input name="cedula" type="text"
            value="${esc(cliente?.cedula || '')}" placeholder="000-0000000-0" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Email</label>
          <input name="email" type="email"
            value="${esc(cliente?.email || '')}" />
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input name="telefono" type="text"
            value="${esc(cliente?.telefono || '')}" placeholder="809-000-0000" />
        </div>
      </div>

      <div class="form-group">
        <label>Dirección</label>
        <input name="direccion" type="text"
          value="${esc(cliente?.direccion || '')}" />
      </div>

    </form>
  `)

  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-save">
      ${esEdit ? 'Guardar cambios' : 'Crear cliente'}
    </button>
  `)
  m.open()

  m.el.querySelector('#mc-cancel').onclick = m.close

  // Envío del formulario
  m.el.querySelector('#mc-save').onclick = async () => {
    const form = m.el.querySelector('#form-cliente')
    const data = Object.fromEntries(new FormData(form))

    // Validación mínima del lado cliente
    if (!data.nombre.trim()) return toast.warning('El nombre es requerido.')

    try {
      if (esEdit) {
        await api.clientes.update(cliente.id, data)
        toast.success('Cliente actualizado.')
      } else {
        await api.clientes.create(data)
        toast.success('Cliente creado.')
      }
      m.close()
      await cargarClientes() // Recarga para reflejar el cambio
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Carga el cliente completo desde el servidor y abre el formulario de edición.
 * Se llama desde la delegación de eventos de la tabla.
 *
 * @param {string} id - UUID del cliente
 */
async function onEditarCliente(id) {
  try {
    const c = await api.clientes.get(id)
    abrirFormCliente(c)
  } catch {
    toast.error('Error al cargar cliente')
  }
}

/**
 * Muestra un modal de confirmación antes de eliminar un cliente.
 * El nombre del cliente se lee desde allClientes (en memoria) para no
 * exponerlo en atributos onclick del HTML.
 *
 * @param {string} id - UUID del cliente
 */
function onEliminarCliente(id) {
  const c = allClientes.find(x => x.id === id)
  if (!c) return

  modal.confirm({
    title:   'Eliminar cliente',
    message: `¿Deseas eliminar a <strong>${esc(c.nombre)}</strong>? Esta acción no se puede deshacer.`,
    danger:  true,
    onConfirm: async () => {
      try {
        await api.clientes.delete(id)
        toast.success('Cliente eliminado.')
        await cargarClientes()
      } catch (err) {
        toast.error(err.message)
      }
    },
  })
}
