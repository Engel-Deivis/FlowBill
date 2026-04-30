/**
 * reportes.js — Página de reportes y análisis
 *
 * Contiene tres pestañas/vistas dinámicas:
 *   1. Ventas    — KPIs de ingresos + gráfico de barras de ventas por día + top clientes
 *   2. ITBIS     — Resumen de impuestos para declaración ante la DGII
 *   3. Inventario — Valorización del inventario y listado de stock por producto
 *
 * Flujo:
 *   renderReportes() → inyecta reportes.html → activa pestaña "Ventas" por defecto
 *   Click en tab → activarTab(nombre) + renderReporte[Ventas|Itbis|Inventario]()
 *
 * Seguridad:
 *   - Datos del API escapados con esc() antes de insertar en innerHTML.
 */

import { api }   from '../api/client.js'
import { toast } from '../components/toast.js'
import { esc }   from '../utils.js'
import Chart     from 'chart.js/auto'

/* HTML base: cabecera y tres botones de pestaña + div #reporte-contenido. */
import reportesHTML from '../../pages/reportes.html?raw'

/**
 * Punto de entrada de la página Reportes.
 * Inyecta el HTML, enlaza los botones de pestaña y carga la vista inicial.
 */
export async function renderReportes() {
  document.getElementById('main').innerHTML = reportesHTML

  // Referencias a los botones de pestaña para cambiar sus estilos
  const tabs = {
    ventas:     document.getElementById('tab-ventas'),
    itbis:      document.getElementById('tab-itbis'),
    inventario: document.getElementById('tab-inventario'),
  }

  /**
   * Resalta visualmente la pestaña activa cambiando su clase btn-primary/secondary.
   *
   * @param {string} nombre - Clave del tab activo ('ventas'|'itbis'|'inventario')
   */
  const activarTab = (nombre) => {
    Object.entries(tabs).forEach(([k, btn]) => {
      btn.className = k === nombre ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'
    })
  }

  tabs.ventas.onclick     = () => { activarTab('ventas');     renderReporteVentas()     }
  tabs.itbis.onclick      = () => { activarTab('itbis');      renderReporteItbis()      }
  tabs.inventario.onclick = () => { activarTab('inventario'); renderReporteInventario() }

  // Carga la pestaña de ventas por defecto al entrar a la página
  renderReporteVentas()
}

/**
 * Renderiza la vista de reporte de ventas:
 *   - 4 KPIs (total ventas, facturas, ITBIS, descuentos)
 *   - Gráfico de barras de ventas por día (últimos 30 días)
 *   - Top 10 clientes por monto
 */
async function renderReporteVentas() {
  const el = document.getElementById('reporte-contenido')
  el.innerHTML = `<div class="spinner"></div>`

  try {
    // Carga paralela de tres fuentes de datos
    const [resumenRes, porDia, topClientes] = await Promise.all([
      api.reportes.ventas(),
      api.reportes.ventasPorDia(30),
      api.reportes.topClientes(),
    ])

    const resumen = resumenRes.resumen || {}

    el.innerHTML = `
      <!-- KPIs de ventas -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div>
            <div class="kpi-label">Total ventas</div>
            <div class="kpi-value">${fmt(resumen.totalVentas || 0)}</div>
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
            <div class="kpi-label">Facturas emitidas</div>
            <div class="kpi-value">${resumen.totalFacturas || 0}</div>
          </div>
          <div class="kpi-icon kpi-icon-success">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                   M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
                   m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
            </svg>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <div class="kpi-label">ITBIS cobrado</div>
            <div class="kpi-value">${fmt(resumen.itbis || 0)}</div>
          </div>
          <div class="kpi-icon kpi-icon-warning">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M9 14l6-6m-5.5.5h.01m4.99 5h.01
                   M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
            </svg>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <div class="kpi-label">Descuentos</div>
            <div class="kpi-value">${fmt(resumen.descuentos || 0)}</div>
          </div>
          <div class="kpi-icon kpi-icon-danger">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M7 7h.01M17 17h.01M7 17L17 7M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Gráfico de barras + top clientes en dos columnas -->
      <div class="charts-grid">
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">Ventas últimos 30 días</div>
          </div>
          <div class="chart-body"><canvas id="reporte-chart"></canvas></div>
        </div>
        <div class="chart-card">
          <div class="chart-header">
            <div class="chart-title">Top 10 Clientes</div>
          </div>
          <div class="chart-body">
            ${topClientes.map((c, i) => `
              <div class="top-list-item">
                <div class="top-list-rank">${i + 1}</div>
                <div class="top-list-name">${esc(c.nombre || 'Consumidor final')}</div>
                <div class="top-list-value">${fmt(c.totalCompras)}</div>
              </div>
            `).join('') || '<div class="empty-state"><p>Sin datos</p></div>'}
          </div>
        </div>
      </div>
    `

    // Gráfico de barras solo si hay datos de días
    if (porDia.length) {
      new Chart(document.getElementById('reporte-chart'), {
        type: 'bar',
        data: {
          labels:   porDia.map(d => fmtFecha(d.fecha)),
          datasets: [{
            label:           'Ventas (RD$)',
            data:            porDia.map(d => d.total),
            backgroundColor: 'rgba(79,70,229,.7)',
            borderRadius:    4,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              grid:  { color: '#F3F4F6' },
              ticks: { callback: v => `$${(v / 1000).toFixed(0)}k` },
            },
            x: { grid: { display: false } },
          },
        },
      })
    }
  } catch (err) {
    toast.error('Error al cargar reporte de ventas')
    console.error(err)
  }
}

/**
 * Renderiza el resumen de ITBIS (impuesto sobre transferencia de bienes industrializados).
 * Útil para preparar la declaración mensual ante la DGII.
 * Solo incluye facturas PENDIENTES y PAGADAS; las ANULADAS están excluidas.
 */
async function renderReporteItbis() {
  const el = document.getElementById('reporte-contenido')
  el.innerHTML = `<div class="spinner"></div>`

  try {
    const data = await api.reportes.itbis()

    el.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">Resumen ITBIS (periodo completo)</span>
        </div>
        <div class="card-body">
          <div class="kpi-grid">
            <div class="kpi-card">
              <div>
                <div class="kpi-label">Subtotal gravable</div>
                <div class="kpi-value">${fmt(data._sum?.subtotal || 0)}</div>
              </div>
              <div class="kpi-icon kpi-icon-primary">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10
                       a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
            </div>
            <div class="kpi-card">
              <div>
                <div class="kpi-label">ITBIS total</div>
                <div class="kpi-value">${fmt(data._sum?.itbis || 0)}</div>
              </div>
              <div class="kpi-icon kpi-icon-warning">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01
                       M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/>
                </svg>
              </div>
            </div>
            <div class="kpi-card">
              <div>
                <div class="kpi-label">Total con ITBIS</div>
                <div class="kpi-value">${fmt(data._sum?.total || 0)}</div>
              </div>
              <div class="kpi-icon kpi-icon-success">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01
                       M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                </svg>
              </div>
            </div>
            <div class="kpi-card">
              <div>
                <div class="kpi-label">Facturas incluidas</div>
                <div class="kpi-value">${data._count?.id || 0}</div>
              </div>
              <div class="kpi-icon kpi-icon-danger">
                <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                       M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2
                       m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              </div>
            </div>
          </div>
          <p style="margin-top:16px;font-size:.85rem;color:var(--gray-500)">
            Los datos incluyen todas las facturas <strong>PENDIENTES</strong> y
            <strong>PAGADAS</strong>. Las anuladas están excluidas.
          </p>
        </div>
      </div>
    `
  } catch {
    toast.error('Error al cargar reporte ITBIS')
  }
}

/**
 * Renderiza el reporte de inventario:
 *   - 4 KPIs: total productos, valor inventario (a costo), con stock bajo, sin stock
 *   - Tabla detallada con todos los productos y su valorización
 *
 * El valor se calcula con el precio de costo cuando disponible; si no, con el precio de venta.
 */
async function renderReporteInventario() {
  const el = document.getElementById('reporte-contenido')
  el.innerHTML = `<div class="spinner"></div>`

  try {
    const productos   = await api.reportes.inventario()
    // Calcula el valor total del inventario sumando costo * stock por producto
    const valorTotal  = productos.reduce(
      (sum, p) => sum + (parseFloat(p.costo || p.precio) * p.stock),
      0
    )

    el.innerHTML = `
      <!-- KPIs de inventario -->
      <div class="kpi-grid" style="margin-bottom:20px">
        <div class="kpi-card">
          <div>
            <div class="kpi-label">Total productos</div>
            <div class="kpi-value">${productos.length}</div>
          </div>
          <div class="kpi-icon kpi-icon-primary">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <div class="kpi-label">Valor inventario (costo)</div>
            <div class="kpi-value">${fmt(valorTotal)}</div>
          </div>
          <div class="kpi-icon kpi-icon-success">
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
            <div class="kpi-label">Con stock bajo</div>
            <div class="kpi-value">
              ${productos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length}
            </div>
          </div>
          <div class="kpi-icon kpi-icon-warning">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94
                   a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
          </div>
        </div>
        <div class="kpi-card">
          <div>
            <div class="kpi-label">Sin stock</div>
            <div class="kpi-value">${productos.filter(p => p.stock === 0).length}</div>
          </div>
          <div class="kpi-icon kpi-icon-danger">
            <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636
                   m12.728 12.728L5.636 5.636"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Tabla detallada de inventario -->
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Costo unit.</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            ${productos.map(p => {
              const rowClass = p.stock === 0
                ? 'row-danger'
                : p.stock <= p.stockMinimo
                  ? 'row-warning'
                  : ''
              const stockClass = p.stock === 0
                ? 'stock-danger'
                : p.stock <= p.stockMinimo
                  ? 'stock-warning'
                  : 'stock-ok'

              return `
                <tr class="${rowClass}">
                  <td class="td-main">${esc(p.nombre)}</td>
                  <td>${esc(p.categoria?.nombre || '—')}</td>
                  <td>
                    <span class="${stockClass}">${p.stock} uds</span>
                  </td>
                  <td>${p.stockMinimo}</td>
                  <td>${fmt(p.costo || p.precio)}</td>
                  <td><strong>${fmt(parseFloat(p.costo || p.precio) * p.stock)}</strong></td>
                </tr>`
            }).join('')}
          </tbody>
        </table>
      </div>
    `
  } catch {
    toast.error('Error al cargar reporte de inventario')
  }
}

/** Formatea un valor como moneda dominicana sin decimales forzados. */
const fmt = (v) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency', currency: 'DOP', minimumFractionDigits: 0,
  }).format(v)

/**
 * Formatea 'YYYY-MM-DD' a etiqueta corta para el eje X del gráfico.
 * El T00:00:00 previene desfase por zona horaria.
 */
const fmtFecha = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('es-DO', {
    month: 'short', day: 'numeric',
  })
