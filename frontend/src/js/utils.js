/**
 * utils.js — Utilidades globales del frontend
 *
 * Funciones auxiliares compartidas por todos los módulos de página.
 * Importar solo lo necesario para evitar dependencias circulares.
 */

/**
 * Escapa caracteres especiales HTML para prevenir ataques XSS (Cross-Site Scripting).
 * Úsalo SIEMPRE que insertes datos del usuario o de la API en innerHTML.
 *
 * Caracteres que escapa:
 *   & → &amp;   < → &lt;   > → &gt;   " → &quot;   ' → &#x27;
 *
 * @param {*} str - Valor a escapar (se convierte a string automáticamente)
 * @returns {string} String seguro para insertar como contenido HTML
 *
 * @example
 *   // Sin escapar (PELIGROSO):
 *   td.innerHTML = `<span>${usuario.nombre}</span>`
 *
 *   // Con escapar (SEGURO):
 *   td.innerHTML = `<span>${esc(usuario.nombre)}</span>`
 */
export const escapeHTML = (str) => {
  if (str == null) return ''
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#x27;')
}

/**
 * Alias corto de escapeHTML para usar en template literals.
 * Nombrado `esc` para que las plantillas sean más legibles.
 *
 * @example
 *   `<div class="td-main">${esc(c.nombre)}</div>`
 */
export const esc = escapeHTML

/**
 * Formatea un valor numérico como moneda dominicana (RD$).
 * Centralizado aquí para que todos los módulos usen el mismo formato.
 *
 * @param {number|string} v - Valor a formatear
 * @returns {string} Ej: "RD$1,250.00"
 */
export const fmt = (v) =>
  new Intl.NumberFormat('es-DO', {
    style:                 'currency',
    currency:              'DOP',
    minimumFractionDigits: 0,
  }).format(v)

/**
 * Formatea una cadena de fecha ISO como fecha legible en español dominicano.
 * Agrega T00:00:00 para evitar desfase de zona horaria al parsear solo la parte YYYY-MM-DD.
 *
 * @param {string} s - Fecha en formato "YYYY-MM-DD" o ISO completo
 * @returns {string} Ej: "15 abr"
 */
export const fmtFecha = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-DO', {
    month: 'short',
    day:   'numeric',
  })
