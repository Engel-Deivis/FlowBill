/**
 * api/client.js — Cliente HTTP centralizado y utilidades de autenticación
 *
 * Toda comunicación con el backend pasa por este módulo.
 * Ventajas de centralizarlo aquí:
 *   1. El token JWT se adjunta automáticamente en cada petición.
 *   2. Los errores HTTP se normalizan en un único lugar (objeto Error con .status).
 *   3. Si el backend cambia de URL base, solo hay que tocar BASE.
 *
 * Seguridad:
 *   - El token se guarda en localStorage (aceptable para SPA sin iframe cross-origin).
 *   - Los parámetros de búsqueda se codifican con URLSearchParams/encodeURIComponent
 *     para evitar inyección de parámetros en la query string.
 *   - NUNCA se expone el token en URLs ni en logs.
 */

/** Prefijo de todas las rutas del backend. El proxy de Vite redirige /api → backend. */
const BASE = '/api'

/** Lee el token JWT almacenado en localStorage tras el login. */
const getToken = () => localStorage.getItem('fb_token')

/**
 * Construye las cabeceras comunes para cada petición.
 * Content-Type siempre JSON; Authorization solo si hay sesión activa.
 */
const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
})

/**
 * Función base de fetch. Todas las llamadas del objeto `api` pasan por aquí.
 *
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} method
 * @param {string} path   - Ruta relativa, ej: '/clientes/123'
 * @param {Object} [body] - Cuerpo JSON (solo para POST/PUT/PATCH)
 * @returns {Promise<*>}  - El campo `data` de la respuesta JSON del backend
 * @throws {Error}        - Error con .status si la respuesta no es 2xx
 */
const request = async (method, path, body) => {
  const opts = { method, headers: headers() }
  if (body !== undefined) opts.body = JSON.stringify(body)

  const res  = await fetch(`${BASE}${path}`, opts)
  const json = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Normaliza el error: usa el mensaje del backend o uno genérico
    const err    = new Error(json.message || `Error ${res.status}`)
    err.status   = res.status
    throw err
  }

  // El backend siempre envuelve los datos en { data: ... }
  return json.data
}

/**
 * API pública del frontend.
 * Cada sección corresponde a un recurso del backend REST.
 */
export const api = {

  /* Atajos de verbo HTTP (para llamadas ad-hoc fuera de los recursos definidos) */
  get:    (path)         => request('GET',    path),
  post:   (path, body)   => request('POST',   path, body),
  put:    (path, body)   => request('PUT',    path, body),
  patch:  (path, body)   => request('PATCH',  path, body),
  delete: (path)         => request('DELETE', path),

  /* ── Autenticación ──────────────────────────────────────────────────── */
  /** Inicia sesión con empresaId + email + password. Devuelve { token, user }. */
  login: (body) => request('POST', '/auth/login', body),
  /** Devuelve el perfil del usuario autenticado (útil para revalidar sesión). */
  me:    ()     => request('GET',  '/auth/me'),

  /* ── Empresas ───────────────────────────────────────────────────────── */
  empresas: {
    list:   ()         => request('GET',    '/empresas'),
    get:    (id)       => request('GET',    `/empresas/${id}`),
    create: (body)     => request('POST',   '/empresas', body),
    update: (id, body) => request('PUT',    `/empresas/${id}`, body),
    delete: (id)       => request('DELETE', `/empresas/${id}`),
  },

  /* ── Clientes ───────────────────────────────────────────────────────── */
  clientes: {
    /** Lista clientes. `search` es codificado para evitar inyección de params. */
    list:   (search)   => request('GET',    `/clientes${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get:    (id)       => request('GET',    `/clientes/${id}`),
    create: (body)     => request('POST',   '/clientes', body),
    update: (id, body) => request('PUT',    `/clientes/${id}`, body),
    delete: (id)       => request('DELETE', `/clientes/${id}`),
  },

  /* ── Productos ──────────────────────────────────────────────────────── */
  productos: {
    list:           (search) => request('GET',    `/productos${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    get:            (id)     => request('GET',    `/productos/${id}`),
    create:         (body)   => request('POST',   '/productos', body),
    update:         (id, b)  => request('PUT',    `/productos/${id}`, b),
    delete:         (id)     => request('DELETE', `/productos/${id}`),
    /** Lista las categorías disponibles para el selector del formulario. */
    categorias:     ()       => request('GET',    '/productos/categorias'),
    crearCategoria: (body)   => request('POST',   '/productos/categorias', body),
  },

  /* ── Facturas ───────────────────────────────────────────────────────── */
  facturas: {
    /** Acepta filtros: { estado, desde, hasta }. URLSearchParams los codifica. */
    list:   (q = {})          => request('GET',   `/facturas?${new URLSearchParams(q)}`),
    get:    (id)              => request('GET',   `/facturas/${id}`),
    create: (body)            => request('POST',  '/facturas', body),
    /** Cambia el estado de una factura (PENDIENTE → PAGADA | ANULADA). */
    estado: (id, estado)      => request('PATCH', `/facturas/${id}/estado`, { estado }),

    /**
     * Descarga el PDF de una factura directamente en el navegador.
     * Usa fetch manual (no `request`) porque la respuesta es un Blob, no JSON.
     * El URL del objeto se libera tras 5 segundos para no llenar memoria.
     */
    pdf: async (id, numero = 'factura') => {
      const res = await fetch(`${BASE}/facturas/${id}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error('No se pudo generar el PDF')

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `factura-${numero}.pdf`
      a.click()

      // Libera la referencia al blob para no acumular memoria
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    },
  },

  /* ── NCF (Números de Comprobante Fiscal — DGII RD) ──────────────────── */
  ncf: {
    list:   ()         => request('GET', '/ncf'),
    create: (body)     => request('POST', '/ncf', body),
    update: (id, b)    => request('PUT',  `/ncf/${id}`, b),
  },

  /* ── Inventario ─────────────────────────────────────────────────────── */
  inventario: {
    /** Acepta filtros: { tipo }. */
    list:      (q = {}) => request('GET',  `/inventario?${new URLSearchParams(q)}`),
    create:    (body)   => request('POST', '/inventario', body),
    /** Devuelve productos cuyo stock actual ≤ stockMinimo. */
    stockBajo: ()       => request('GET',  '/inventario/stock-bajo'),
  },

  /* ── Reportes ───────────────────────────────────────────────────────── */
  reportes: {
    /** Resumen general: total ventas, ITBIS, descuentos, nº facturas. */
    ventas:       (q = {}) => request('GET', `/reportes/ventas?${new URLSearchParams(q)}`),
    /** Ventas agrupadas por día para el gráfico de línea/barras. */
    ventasPorDia: (dias)   => request('GET', `/reportes/ventas-por-dia?dias=${dias}`),
    /** Top clientes ordenados por monto total de compras. */
    topClientes:  ()       => request('GET', '/reportes/top-clientes'),
    /** Resumen de ITBIS generado (para declaración ante la DGII). */
    itbis:        (q = {}) => request('GET', `/reportes/itbis?${new URLSearchParams(q)}`),
    /** Lista completa de productos con stock y valorización. */
    inventario:   ()       => request('GET', '/reportes/inventario'),
  },
}

/**
 * Utilidades de sesión del usuario.
 * Gestiona el JWT y el perfil de usuario en localStorage.
 *
 * Nota: localStorage es accesible por cualquier script de la misma origin.
 *       Para mayor seguridad en producción se podría usar httpOnly cookies,
 *       pero para una SPA multi-tenant sin SSR, localStorage es aceptable.
 */
export const auth = {
  /** Persiste el token y el objeto usuario tras un login exitoso. */
  save: (token, user) => {
    localStorage.setItem('fb_token', token)
    localStorage.setItem('fb_user',  JSON.stringify(user))
  },

  /** Elimina la sesión (logout). Llamado desde el botón "Cerrar sesión". */
  clear: () => {
    localStorage.removeItem('fb_token')
    localStorage.removeItem('fb_user')
  },

  /** Devuelve el objeto usuario deserializado, o null si no hay sesión. */
  user: () => {
    try { return JSON.parse(localStorage.getItem('fb_user')) }
    catch { return null }
  },

  /** Comprueba si hay un token activo (no valida expiración, eso lo hace el backend). */
  isLoggedIn: () => !!localStorage.getItem('fb_token'),
}
