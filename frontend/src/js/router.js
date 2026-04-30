/**
 * router.js — Enrutador SPA basado en hash (#)
 *
 * Maneja la navegación entre páginas sin recarga usando window.location.hash.
 * Cada ruta tiene una función `render` asociada y una bandera `public` que
 * indica si requiere autenticación.
 *
 * Flujo de navegación (router.go):
 *   1. Si la ruta no existe → redirige a 'dashboard'
 *   2. Si la ruta requiere auth y no hay sesión → redirige a 'login'
 *   3. Si ya está en login y hay sesión → redirige a 'dashboard'
 *   4. Rutas protegidas → renderShell() (sidebar + topbar) + render()
 *   5. Rutas públicas (login) → solo render() (sin shell)
 *
 * Seguridad:
 *   - El nombre/empresa del usuario se insertan con esc() para prevenir XSS
 *     en caso de que la API devuelva datos con caracteres especiales.
 *   - initials se calcula localmente sin insertar HTML sin escapar.
 */

import { auth }                    from './api/client.js'
import { renderSidebar,
         initSidebarEvents }       from './components/sidebar.js'
import { esc }                     from './utils.js'

// Importa todas las páginas — cada módulo exporta una función render*()
import { renderDashboard }  from './pages/dashboard.js'
import { renderClientes }   from './pages/clientes.js'
import { renderProductos }  from './pages/productos.js'
import { renderFacturas }   from './pages/facturas.js'
import { renderInventario } from './pages/inventario.js'
import { renderReportes }   from './pages/reportes.js'
import { renderNcf }        from './pages/ncf.js'
import { renderLogin }      from './pages/login.js'

/**
 * Mapa de rutas disponibles.
 * - render: función que pinta el contenido en #main
 * - title:  texto que aparece en el topbar
 * - public: si true, no requiere autenticación (solo login por ahora)
 */
const routes = {
  login:      { render: renderLogin,     public: true  },
  dashboard:  { render: renderDashboard, title: 'Dashboard'  },
  clientes:   { render: renderClientes,  title: 'Clientes'   },
  productos:  { render: renderProductos, title: 'Productos'  },
  facturas:   { render: renderFacturas,  title: 'Facturas'   },
  inventario: { render: renderInventario,title: 'Inventario' },
  reportes:   { render: renderReportes,  title: 'Reportes'   },
  ncf:        { render: renderNcf,       title: 'NCF'        },
}

/** Ruta actualmente renderizada (evita re-renders duplicados en hashchange). */
let currentRoute = null

/**
 * Genera el HTML del shell de la aplicación (sidebar + topbar + área #main).
 * Se inserta en #app en cada navegación a rutas protegidas.
 *
 * Las iniciales del usuario se calculan tomando la primera letra de cada palabra
 * del nombre, limitado a 2 caracteres (ej: "Juan Pérez" → "JP").
 *
 * @param {string} route - Ruta activa para marcar el ítem del sidebar
 */
const renderShell = (route) => {
  const user     = auth.user()
  const initials = user?.nombre
    ? user.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  document.getElementById('app').innerHTML = `
    ${renderSidebar(route)}

    <div class="topbar">
      <div class="topbar-left">
        <span class="topbar-title" id="page-title">${esc(routes[route]?.title || '')}</span>
      </div>
      <div class="topbar-right">
        <div class="topbar-user">
          <!-- Avatar con las iniciales del nombre del usuario -->
          <div class="topbar-avatar">${esc(initials)}</div>
          <div class="topbar-user-info">
            <div class="topbar-user-name">${esc(user?.nombre || 'Usuario')}</div>
            <div class="topbar-user-role">${esc(user?.rol    || '')}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenedor principal donde cada página inyecta su HTML -->
    <main id="main"><div class="spinner"></div></main>
  `

  // Enlaza los clicks del sidebar y el botón de logout después de insertar el HTML
  initSidebarEvents()
}

/**
 * Objeto principal del router. Expuesto globalmente para que las páginas
 * puedan llamar router.go() y router.setTitle().
 */
export const router = {
  /**
   * Navega a la ruta indicada.
   * Aplica las reglas de autenticación antes de renderizar.
   *
   * @param {string} route - Clave de la ruta (ej: 'dashboard', 'clientes')
   */
  go(route) {
    // Ruta inexistente → fallback a dashboard
    if (!routes[route]) route = 'dashboard'

    const def = routes[route]

    // Ruta protegida sin sesión → redirige al login
    if (!def.public && !auth.isLoggedIn()) {
      return this.go('login')
    }

    // Ya está logueado e intenta ir al login → redirige al dashboard
    if (def.public && auth.isLoggedIn() && route === 'login') {
      return this.go('dashboard')
    }

    currentRoute            = route
    window.location.hash    = route

    if (def.public) {
      // Login: limpia el contenido de #app y renderiza directamente
      document.getElementById('app').innerHTML = ''
      def.render()
    } else {
      // Página protegida: primero pinta el shell (sidebar + topbar), luego el contenido
      renderShell(route)
      def.render()
    }
  },

  /**
   * Inicializa el router al cargar la app:
   *   - Lee el hash actual de la URL
   *   - Navega a la ruta correspondiente (o dashboard/login si no hay hash)
   *   - Escucha cambios de hash para navegación con el botón Atrás del navegador
   */
  init() {
    const hash  = window.location.hash.replace('#', '') || ''
    const route = routes[hash] ? hash : auth.isLoggedIn() ? 'dashboard' : 'login'
    this.go(route)

    // Soporte para navegación con historial del navegador (botón atrás/adelante)
    window.addEventListener('hashchange', () => {
      const h = window.location.hash.replace('#', '')
      if (h !== currentRoute && routes[h]) this.go(h)
    })
  },

  /**
   * Actualiza el título visible en el topbar y el título de la pestaña del navegador.
   * Útil para páginas que calculan su título dinámicamente.
   *
   * @param {string} t - Nuevo título
   */
  setTitle(t) {
    const el = document.getElementById('page-title')
    if (el) el.textContent = t
    document.title = `${t} — FlowBill`
  },
}
