/**
 * dashboard.js — Pantalla principal / resumen ejecutivo
 *
 * Carga datos de múltiples endpoints en paralelo para mostrar:
 *   - 4 KPIs: ventas totales, ventas de hoy, ITBIS generado, facturas pendientes
 *   - Gráfico de línea: ventas de los últimos 30 días (Chart.js)
 *   - Top 6 clientes por monto de compra
 *   - Últimas 6 facturas emitidas
 *   - Alertas de productos con stock bajo
 *
 * Todas las peticiones van en paralelo con Promise.all; si alguna falla,
 * el `.catch(() => defaultValue)` evita que el dashboard quede en blanco.
 *
 * Seguridad:
 *   - Datos del API escapados con esc() antes de insertar en innerHTML.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { esc }   from '../utils.js'
import Chart     from 'chart.js/auto'

/* HTML base: grilla de KPIs, tarjetas de gráfico y secciones inferiores. */
import dashboardHTML from '../../pages/dashboard.html?raw'

/**
 * Punto de entrada de la página Dashboard.
 * Inyecta la estructura HTML y lanza todas las cargas en paralelo.
 */
export async function renderDashboard() {
  const main = document.getElementById('main')
  main.innerHTML = dashboardHTML

  try {
    // Carga paralela: falla silenciosa en cada fuente para no bloquear el resto
    const [ventasRes, topClientes, facturasRes, stockBajo] = await Promise.all([
      api.reportes.ventas().catch(()           => ({ resumen: {}, facturas: [] })),
      api.reportes.topClientes().catch(()      => []),
      api.facturas.list({ estado: '' }).catch(() => []),
      api.inventario.stockBajo().catch(()      => []),
    ])

    const resumen  = ventasRes.resumen || {}
    const facturas = facturasRes        || []

    // Calcula métricas derivadas localmente para evitar peticiones adicionales
    const pendientes = facturas.filter(f => f.estado === 'PENDIENTE').length
    const hoy        = new Date().toDateString()
    const hoyTotal   = facturas
      .filter(f => new Date(f.fecha).toDateString() === hoy && f.estado !== 'ANULADA')
      .reduce((sum, f) => sum + parseFloat(f.total || 0), 0)

    // ── KPIs ─────────────────────────────────────────────────────────────
    document.getElementById('kpis').innerHTML = `
      <div class="kpi-card">
        <div>
          <div class="kpi-label">Ventas totales</div>
          <div class="kpi-value">${fmt(resumen.totalVentas || 0)}</div>
          <div class="kpi-sub">${resumen.totalFacturas || 0} facturas</div>
        </div>
        <div class="kpi-icon kpi-icon-primary">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2
                 m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1
                 m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-label">Ventas de hoy</div>
          <div class="kpi-value">${fmt(hoyTotal)}</div>
          <div class="kpi-sub">Día actual</div>
        </div>
        <div class="kpi-icon kpi-icon-success">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-label">ITBIS generado</div>
          <div class="kpi-value">${fmt(resumen.itbis || 0)}</div>
          <div class="kpi-sub">Total periodo</div>
        </div>
        <div class="kpi-icon kpi-icon-warning">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16
                 l3.5-2 3.5 2 3.5-2 3.5 2z"/>
          </svg>
        </div>
      </div>

      <div class="kpi-card">
        <div>
          <div class="kpi-label">Por cobrar</div>
          <div class="kpi-value">${pendientes}</div>
          <div class="kpi-sub">Facturas pendientes</div>
        </div>
        <div class="kpi-icon kpi-icon-danger">
          <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    `

    // ── Gráfico de ventas ─────────────────────────────────────────────────
    const ventasDia = await api.reportes.ventasPorDia(30).catch(() => [])
    renderVentasChart(ventasDia)

    // ── Top clientes ──────────────────────────────────────────────────────
    const tcEl = document.getElementById('top-clientes-list')
    if (!topClientes.length) {
      tcEl.innerHTML = `<div class="empty-state"><p>Sin datos aún</p></div>`
    } else {
      tcEl.innerHTML = topClientes.slice(0, 6).map((c, i) => `
        <div class="top-list-item">
          <div class="top-list-rank">${i + 1}</div>
          <div class="top-list-name">${esc(c.nombre || 'Consumidor final')}</div>
          <div class="top-list-value">${fmt(c.totalCompras)}</div>
        </div>
      `).join('')
    }

    // ── Facturas recientes ────────────────────────────────────────────────
    document.getElementById('facturas-recientes').innerHTML =
      facturas.slice(0, 6).map(f => `
        <div class="recent-factura">
          <span class="recent-factura-num">${esc(f.numero)}</span>
          <span class="recent-factura-cliente">${esc(f.cliente?.nombre || 'Consumidor final')}</span>
          <span class="badge badge-${estadoBadge(f.estado)}">${esc(f.estado)}</span>
          <span class="recent-factura-total">${fmt(f.total)}</span>
        </div>
      `).join('') || `<div class="empty-state"><p>Sin facturas aún</p></div>`

    // ── Alertas de stock bajo ─────────────────────────────────────────────
    document.getElementById('stock-alertas').innerHTML = !stockBajo.length
      ? `<div class="empty-state"><p>Todo en orden 👍</p></div>`
      : stockBajo.slice(0, 8).map(p => `
          <div class="stock-alert-item">
            <span class="stock-alert-name">${esc(p.nombre)}</span>
            <span class="stock-alert-num ${p.stock === 0 ? 'stock-danger' : 'stock-warning'}">
              ${p.stock} uds
            </span>
          </div>
        `).join('')

  } catch (err) {
    toast.error('Error cargando el dashboard')
    console.error(err)
  }
}

/**
 * Crea el gráfico de línea de ventas de los últimos 30 días usando Chart.js.
 * Si no hay datos, no se crea el gráfico (canvas queda vacío).
 *
 * @param {Array} data - Array de { fecha: 'YYYY-MM-DD', total: number }
 */
function renderVentasChart(data) {
  const canvas = document.getElementById('chart-ventas')
  if (!canvas || !data.length) return

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map(d => fmtFecha(d.fecha)),
      datasets: [{
        label:                'Ventas (RD$)',
        data:                 data.map(d => d.total),
        borderColor:          '#4F46E5',
        backgroundColor:      'rgba(79,70,229,.08)',
        borderWidth:          2,
        fill:                 true,
        tension:              .4,          // Curva suavizada
        pointRadius:          3,
        pointBackgroundColor: '#4F46E5',
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          grid:  { color: '#F3F4F6' },
          ticks: { callback: v => `$${(v / 1000).toFixed(0)}k` }, // Abrevia miles
        },
        x: { grid: { display: false } },
      },
    },
  })
}

/** Formatea un valor como moneda dominicana sin decimales forzados. */
const fmt = (v) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency', currency: 'DOP', minimumFractionDigits: 0,
  }).format(v)

/**
 * Formatea 'YYYY-MM-DD' a mes+día (ej: "15 abr").
 * El T00:00:00 evita el desfase de un día por zona horaria.
 */
const fmtFecha = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-DO', {
    month: 'short', day: 'numeric',
  })

/** Mapea estado de factura a variante de badge CSS. */
const estadoBadge = (e) =>
  ({ PENDIENTE: 'warning', PAGADA: 'success', ANULADA: 'danger' }[e] || 'gray')
