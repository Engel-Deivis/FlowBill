/**
 * ncf.js — Página de gestión de secuencias NCF
 *
 * NCF = Número de Comprobante Fiscal, exigido por la DGII (República Dominicana).
 * Permite ver, crear y editar secuencias por tipo de comprobante (B01, B02, B14, B15, B16).
 *
 * Flujo principal:
 *   renderNcf() → carga el HTML de la vista → cargarNcf() → renderiza filas de tabla
 *
 * Seguridad:
 *   - Todos los datos del servidor se escapan con esc() antes de insertarse en innerHTML.
 *   - Los onclick de botones solo pasan el ID (UUID); el nombre del objeto se lee
 *     desde el array en memoria para evitar inyección a través de atributos HTML.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { modal } from '../components/modal.js'
import { esc }   from '../utils.js'

/* Template HTML de la página — importado como texto plano (Vite ?raw).
   La estructura estática vive en ncf.html; este JS solo maneja la lógica. */
import ncfHTML from '../../pages/ncf.html?raw'

/** Lista de secuencias actualmente cargadas (caché en memoria para lookups). */
let allSecuencias = []

/**
 * Punto de entrada de la página NCF.
 * Inyecta el HTML base en #main, carga datos y enlaza eventos.
 */
export async function renderNcf() {
  document.getElementById('main').innerHTML = ncfHTML

  await cargarNcf()

  // Botón "Nueva secuencia" → abre el formulario de creación
  document.getElementById('btn-nueva-secuencia').onclick = () => abrirFormNcf()
}

/**
 * Obtiene todas las secuencias NCF del servidor y repinta la tabla.
 * Si la petición falla muestra un toast de error (no rompe la UI).
 */
async function cargarNcf() {
  try {
    allSecuencias = await api.ncf.list()
    renderTabla(allSecuencias)
  } catch {
    toast.error('Error al cargar secuencias NCF')
  }
}

/**
 * Genera las filas HTML de la tabla de secuencias y las inserta en #ncf-tbody.
 *
 * Lógica de estado visual:
 *   - Restantes ≤ 100 → advertencia amarilla
 *   - Restantes ≤ 10  → danger rojo (más urgente)
 *   - Fecha vencimiento < hoy → badge "Vencida"
 *
 * @param {Array} secuencias - Array de objetos secuencia del API
 */
function renderTabla(secuencias) {
  const tbody = document.getElementById('ncf-tbody')
  if (!tbody) return

  // Estado vacío
  if (!secuencias.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state"><p>No hay secuencias NCF configuradas</p></div>
        </td>
      </tr>`
    return
  }

  tbody.innerHTML = secuencias.map(s => {
    const usados    = s.secuenciaActual - s.secuenciaMin + 1
    const restantes = s.secuenciaMax - s.secuenciaActual
    const vencido   = new Date(s.vencimiento) < new Date()

    // Clase CSS según nivel de urgencia de los restantes
    const restantesClass = restantes <= 10
      ? 'stock-danger'
      : restantes <= 100
        ? 'stock-warning'
        : ''

    // Badge de estado: prioridad vencida > activa > inactiva
    const badgeEstado = vencido
      ? `<span class="badge badge-danger">Vencida</span>`
      : s.activa
        ? `<span class="badge badge-success">Activa</span>`
        : `<span class="badge badge-gray">Inactiva</span>`

    return `
      <tr>
        <td><strong>${esc(s.tipoNcf)}</strong></td>
        <td>
          <code style="background:var(--gray-100);padding:2px 6px;border-radius:4px;font-size:.85rem">
            ${esc(s.prefijo)}
          </code>
        </td>
        <td>${s.secuenciaMin.toLocaleString()} – ${s.secuenciaMax.toLocaleString()}</td>
        <td>${Math.max(0, usados).toLocaleString()}</td>
        <td class="${restantesClass}">${restantes.toLocaleString()}</td>
        <td>${new Date(s.vencimiento).toLocaleDateString('es-DO')}</td>
        <td>${badgeEstado}</td>
        <td class="col-actions">
          <button class="btn-icon" title="Editar" data-id="${esc(s.id)}">
            <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                   m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
        </td>
      </tr>`
  }).join('')

  // Delegación de eventos: un solo listener en tbody para todos los botones de edición
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-id]')
    if (!btn) return
    editarNcf(btn.dataset.id)
  }, { once: true }) // once:true evita acumulación de listeners en cada carga
}

/**
 * Abre un modal con el formulario para crear o editar una secuencia NCF.
 *
 * @param {Object|null} secuencia - Objeto secuencia para edición, o null para creación
 */
function abrirFormNcf(secuencia = null) {
  const esEdit = !!secuencia
  const m = modal.create({
    title: esEdit ? 'Editar secuencia NCF' : 'Nueva secuencia NCF',
  })

  m.setBody(`
    <form id="form-ncf">

      <!-- Tipo NCF y prefijo -->
      <div class="form-row">
        <div class="form-group">
          <label>Tipo NCF <span class="required">*</span></label>
          <!-- En edición el tipo no se puede cambiar (la secuencia ya está en uso) -->
          <select name="tipoNcf" ${esEdit ? 'disabled' : ''}>
            <option value="B01" ${secuencia?.tipoNcf === 'B01' ? 'selected' : ''}>B01 — Crédito Fiscal</option>
            <option value="B02" ${secuencia?.tipoNcf === 'B02' ? 'selected' : ''}>B02 — Consumo</option>
            <option value="B14" ${secuencia?.tipoNcf === 'B14' ? 'selected' : ''}>B14 — Régimen Especial</option>
            <option value="B15" ${secuencia?.tipoNcf === 'B15' ? 'selected' : ''}>B15 — Gubernamental</option>
            <option value="B16" ${secuencia?.tipoNcf === 'B16' ? 'selected' : ''}>B16 — Exportaciones</option>
          </select>
        </div>
        <div class="form-group">
          <label>Prefijo <span class="required">*</span></label>
          <input name="prefijo" type="text"
            value="${esc(secuencia?.prefijo || 'B01')}"
            placeholder="B01" maxlength="3" />
        </div>
      </div>

      <!-- Rango de secuencia numérica autorizado por la DGII -->
      <div class="form-row">
        <div class="form-group">
          <label>Secuencia mínima <span class="required">*</span></label>
          <input name="secuenciaMin" type="number" min="1"
            value="${secuencia?.secuenciaMin || 1}" />
        </div>
        <div class="form-group">
          <label>Secuencia máxima <span class="required">*</span></label>
          <input name="secuenciaMax" type="number" min="1"
            value="${secuencia?.secuenciaMax || 500}" />
        </div>
      </div>

      <!-- Fecha límite de vigencia del comprobante -->
      <div class="form-group">
        <label>Fecha de vencimiento <span class="required">*</span></label>
        <input name="vencimiento" type="date"
          value="${secuencia?.vencimiento ? secuencia.vencimiento.split('T')[0] : ''}" />
      </div>

      <!-- Control de estado solo disponible en edición -->
      ${esEdit ? `
        <div class="form-group">
          <label>Estado</label>
          <select name="activa">
            <option value="true"  ${secuencia?.activa  ? 'selected' : ''}>Activa</option>
            <option value="false" ${!secuencia?.activa ? 'selected' : ''}>Inactiva</option>
          </select>
        </div>
      ` : ''}

    </form>
  `)

  m.appendFooter(`
    <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
    <button class="btn btn-primary"   id="mc-save">
      ${esEdit ? 'Guardar cambios' : 'Crear secuencia'}
    </button>
  `)
  m.open()

  m.el.querySelector('#mc-cancel').onclick = m.close

  // Guardar: valida, llama API y recarga tabla
  m.el.querySelector('#mc-save').onclick = async () => {
    const form = m.el.querySelector('#form-ncf')
    const data = Object.fromEntries(new FormData(form))

    // Validación básica del lado cliente
    if (!data.prefijo || !data.vencimiento) {
      return toast.warning('Prefijo y fecha de vencimiento son requeridos.')
    }

    try {
      if (esEdit) {
        // activa llega como string 'true'/'false' desde el select, convertir a boolean
        await api.ncf.update(secuencia.id, { ...data, activa: data.activa === 'true' })
        toast.success('Secuencia actualizada.')
      } else {
        await api.ncf.create(data)
        toast.success('Secuencia NCF creada.')
      }
      m.close()
      await cargarNcf()
    } catch (err) {
      toast.error(err.message)
    }
  }
}

/**
 * Busca la secuencia por ID en el caché local y abre el formulario de edición.
 * Al usar el caché evitamos una petición extra al servidor y no necesitamos
 * pasar datos del usuario a través de atributos onclick.
 *
 * @param {string} id - ID de la secuencia NCF
 */
function editarNcf(id) {
  const s = allSecuencias.find(x => x.id === id)
  if (s) {
    abrirFormNcf(s)
  } else {
    toast.error('Secuencia no encontrada')
  }
}
