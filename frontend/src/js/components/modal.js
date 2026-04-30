/**
 * modal.js — Sistema de modales reutilizables
 *
 * Crea modales programáticamente sin necesidad de tener HTML oculto en el DOM.
 * Se agregan al body dinámicamente y se eliminan al cerrar.
 *
 * API pública:
 *   modal.create({ title, body?, size?, onClose? })
 *     → retorna un objeto con: open(), close(), setTitle(), setBody(), appendFooter(), el
 *
 *   modal.confirm({ title?, message, onConfirm, danger? })
 *     → modal de confirmación con botones Cancelar / Confirmar
 *
 * Tamaños disponibles (clase CSS):
 *   ''   → ancho por defecto (~500px)
 *   'lg' → modal grande (~700px)
 *   'xl' → modal extra grande (~900px, para formularios complejos)
 *
 * Accesibilidad:
 *   - Click fuera del modal (en el overlay) → cierra
 *   - Tecla Escape → cierra (el listener se limpia automáticamente al cerrar)
 *   - Botón X con aria-label="Cerrar"
 *
 * Seguridad:
 *   El contenido (body, footer) lo inyectan los módulos de página con su HTML.
 *   Es responsabilidad de cada módulo escapar los datos antes de pasarlos aquí.
 */

export const modal = {
  /**
   * Crea un modal y devuelve su objeto de control.
   * El modal NO se muestra hasta llamar .open().
   *
   * @param {Object} options
   * @param {string}   options.title    - Título del modal
   * @param {string}   [options.body]   - HTML inicial del cuerpo (puede actualizarse con setBody)
   * @param {string}   [options.size]   - Modificador de tamaño: 'lg' | 'xl' | ''
   * @param {Function} [options.onClose]- Callback ejecutado al cerrar el modal
   * @returns {{ open, close, setTitle, setBody, appendFooter, el }}
   */
  create({ title, body = '', size = '', onClose } = {}) {
    // Crea el overlay que cubre toda la pantalla
    const overlay       = document.createElement('div')
    overlay.className   = 'modal-overlay'

    overlay.innerHTML = `
      <div class="modal ${size ? 'modal-' + size : ''}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" aria-label="Cerrar">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">${body}</div>
      </div>
    `

    const closeBtn = overlay.querySelector('.modal-close')

    /** Cierra el modal: lo quita del DOM y dispara el callback onClose si existe. */
    const close = () => {
      overlay.remove()
      onClose?.()
    }

    // Cierra al hacer click en el botón X
    closeBtn.addEventListener('click', close)

    // Cierra al hacer click fuera del modal (en el overlay oscuro)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close()
    })

    // Cierra con Escape — el listener se remueve automáticamente al cerrar
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') {
        close()
        document.removeEventListener('keydown', esc)
      }
    })

    return {
      /** Agrega el overlay al body y hace visible el modal. */
      open() { document.body.appendChild(overlay); return this },

      /** Cierra y destruye el modal. */
      close,

      /** Actualiza el texto del título (usa textContent, no innerHTML). */
      setTitle(t) {
        overlay.querySelector('.modal-title').textContent = t
        return this
      },

      /**
       * Reemplaza el contenido HTML del cuerpo del modal.
       * El llamante es responsable de escapar cualquier dato antes de pasar el HTML.
       */
      setBody(html) {
        overlay.querySelector('.modal-body').innerHTML = html
        return this
      },

      /**
       * Crea o actualiza el pie del modal con los botones de acción.
       * Si el pie ya existe, reemplaza su contenido.
       */
      appendFooter(html) {
        let footer = overlay.querySelector('.modal-footer')
        if (!footer) {
          footer           = document.createElement('div')
          footer.className = 'modal-footer'
          overlay.querySelector('.modal').appendChild(footer)
        }
        footer.innerHTML = html
        return this
      },

      /** Referencia al elemento overlay (útil para agregar event listeners). */
      el: overlay,
    }
  },

  /**
   * Muestra un modal de confirmación con botones Cancelar / Confirmar.
   * Ideal para acciones destructivas (eliminar, cambiar estado, etc.).
   *
   * @param {Object}   options
   * @param {string}   [options.title]     - Título del modal
   * @param {string}   options.message     - Mensaje descriptivo (puede contener HTML básico)
   * @param {Function} options.onConfirm   - Callback ejecutado si el usuario confirma
   * @param {boolean}  [options.danger]    - Si true, el botón de confirmar es rojo (btn-danger)
   */
  confirm({ title = '¿Estás seguro?', message, onConfirm, danger = false } = {}) {
    const m = modal.create({
      title,
      body: `<p style="color:var(--gray-600);font-size:.9rem">${message}</p>`,
    })

    m.appendFooter(`
      <button class="btn btn-secondary" id="mc-cancel">Cancelar</button>
      <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="mc-ok">Confirmar</button>
    `)
    m.open()

    m.el.querySelector('#mc-cancel').onclick = m.close
    m.el.querySelector('#mc-ok').onclick     = () => { m.close(); onConfirm?.() }
  },
}
