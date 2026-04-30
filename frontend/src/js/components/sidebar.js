/**
 * sidebar.js — Componente de barra lateral de navegación
 *
 * Genera el HTML del sidebar y enlaza los eventos de navegación y logout.
 * Separa la generación de HTML (renderSidebar) de la lógica de eventos
 * (initSidebarEvents) para que puedan llamarse en el momento correcto
 * después de que el DOM esté listo.
 *
 * Control de acceso:
 *   La ruta 'ncf' está restringida a roles ADMIN y SUPERADMIN.
 *   El filtro en navItems excluye automáticamente las rutas con `roles`
 *   si el usuario no tiene el rol requerido.
 *
 * Seguridad:
 *   - Nombre de empresa y RNC del usuario se escapan con esc() para prevenir XSS.
 *   - Los data-route solo aceptan valores del array navItems (no input del usuario).
 */

import { auth }   from '../api/client.js'
import { router } from '../router.js'
import { esc }    from '../utils.js'

/**
 * Configuración de la navegación principal.
 * `roles` es opcional; si no se define, la ruta es accesible para todos los usuarios.
 */
const navItems = [
  { route: 'dashboard',  label: 'Dashboard',  icon: 'home'     },
  { route: 'facturas',   label: 'Facturas',   icon: 'receipt'  },
  { route: 'clientes',   label: 'Clientes',   icon: 'users'    },
  { route: 'productos',  label: 'Productos',  icon: 'box'      },
  { route: 'inventario', label: 'Inventario', icon: 'archive'  },
  { route: 'reportes',   label: 'Reportes',   icon: 'chart'    },
  // NCF: solo visible para administradores (restricción por rol)
  { route: 'ncf',        label: 'NCF',        icon: 'document', roles: ['ADMIN', 'SUPERADMIN'] },
]

/** Mapa de iconos SVG por nombre. Centralizado para fácil mantenimiento. */
const icons = {
  home: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
  </svg>`,
  receipt: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
  </svg>`,
  users: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
  </svg>`,
  box: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
  </svg>`,
  archive: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/>
  </svg>`,
  chart: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
  </svg>`,
  document: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
  </svg>`,
  logout: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
  </svg>`,
}

/**
 * Genera el HTML del sidebar como string para insertarlo en el shell.
 * Filtra los ítems de navegación según el rol del usuario.
 *
 * @param {string} currentRoute - Ruta activa para marcar el ítem como 'active'
 * @returns {string} HTML del elemento <aside>
 */
export function renderSidebar(currentRoute) {
  const user = auth.user()

  return `
    <aside class="sidebar">

      <!-- Logo y nombre de la aplicación -->
      <div class="sidebar-logo">
        <div class="sidebar-logo-text">FlowBill</div>
        <div class="sidebar-logo-sub">Sistema de Facturación</div>
      </div>

      <!-- Nombre y RNC de la empresa activa (del perfil del usuario) -->
      ${user ? `
        <div class="sidebar-empresa">
          <div class="sidebar-empresa-name">${esc(user.empresa?.nombre || 'Mi Empresa')}</div>
          <div class="sidebar-empresa-rnc">RNC: ${esc(user.empresa?.rnc || '—')}</div>
        </div>
      ` : ''}

      <!-- Menú de navegación filtrado por rol -->
      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Navegación</div>
        ${navItems
          .filter(item => !item.roles || (user && item.roles.includes(user.rol)))
          .map(item => `
            <div class="sidebar-item ${currentRoute === item.route ? 'active' : ''}"
                 data-route="${item.route}">
              ${icons[item.icon]}
              ${item.label}
            </div>
          `).join('')}
      </nav>

      <!-- Botón de cierre de sesión en la parte inferior -->
      <div class="sidebar-footer">
        <button class="sidebar-logout" id="btn-logout">
          ${icons.logout}
          Cerrar sesión
        </button>
      </div>

    </aside>
  `
}

/**
 * Enlaza los eventos de navegación y logout DESPUÉS de que el sidebar
 * haya sido insertado en el DOM por renderShell().
 * Debe llamarse siempre inmediatamente después de renderShell().
 */
export function initSidebarEvents() {
  // Click en cualquier ítem del sidebar → navega a la ruta indicada
  document.querySelectorAll('.sidebar-item[data-route]').forEach(el => {
    el.addEventListener('click', () => router.go(el.dataset.route))
  })

  // Botón logout → limpia sesión y redirige al login
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    auth.clear()
    router.go('login')
  })
}
