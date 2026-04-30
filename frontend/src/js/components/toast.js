/**
 * toast.js — Sistema de notificaciones emergentes (toasts)
 *
 * Muestra mensajes flotantes en la esquina de la pantalla que desaparecen
 * automáticamente. El contenedor #toast-container está definido en index.html.
 *
 * Tipos disponibles:
 *   success — Operación completada (verde)
 *   error   — Fallo o error crítico (rojo, 5 seg)
 *   warning — Advertencia o validación (amarillo)
 *   info    — Información general (azul)
 *
 * Uso:
 *   import { toast } from '../components/toast.js'
 *   toast.success('Cliente creado.')
 *   toast.error('Error al guardar.')
 *
 * Seguridad:
 *   Los mensajes se insertan con innerHTML pero provienen exclusivamente
 *   de strings estáticos del código (no de datos del usuario ni del API).
 *   El texto del mensaje usa un <span> separado del icono SVG.
 */

/** SVG icons indexados por tipo para insertar en el toast. */
const icons = {
  success: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
  </svg>`,
  error: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
  </svg>`,
  warning: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
  </svg>`,
  info: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/>
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0-4h.01"/>
  </svg>`,
}

export const toast = {
  /**
   * Muestra un toast con el mensaje y tipo indicados.
   * El elemento se elimina del DOM tras `duration` milisegundos con fade-out.
   *
   * @param {string} message  - Texto a mostrar al usuario
   * @param {string} type     - 'success'|'error'|'warning'|'info'
   * @param {number} duration - Tiempo visible en ms (por defecto 3500)
   */
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container')
    const el        = document.createElement('div')
    el.className    = `toast toast-${type}`

    // El mensaje es un string estático del código — safe para innerHTML
    el.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span>${message}</span>
    `

    container.appendChild(el)

    // Fade-out y eliminación del DOM al vencer el tiempo
    setTimeout(() => {
      el.style.opacity    = '0'
      el.style.transition = 'opacity .3s'
      setTimeout(() => el.remove(), 300)
    }, duration)
  },

  /** Notificación de éxito (3.5 s). */
  success: (msg) => toast.show(msg, 'success'),

  /** Notificación de error (5 s — más tiempo para que el usuario lo lea). */
  error:   (msg) => toast.show(msg, 'error', 5000),

  /** Notificación de advertencia (3.5 s). */
  warning: (msg) => toast.show(msg, 'warning'),

  /** Notificación informativa (3.5 s). */
  info:    (msg) => toast.show(msg, 'info'),
}
