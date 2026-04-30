const PDFDocument = require('pdfkit')

/**
 * Genera el PDF de una factura y lo escribe en el response (stream).
 * @param {object} factura - Factura completa con items, cliente y empresa
 * @param {object} res - Express response object
 */
const generarFacturaPdf = (factura, res) => {
  const doc = new PDFDocument({ margin: 50, size: 'A4' })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename="factura-${factura.numero}.pdf"`)
  doc.pipe(res)

  const colorPrimario = '#4F46E5'
  const colorGris = '#6B7280'
  const colorNegro = '#111827'
  const colorLinea = '#E5E7EB'

  // ── Encabezado ──────────────────────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 120).fill(colorPrimario)

  doc.fillColor('white').fontSize(26).font('Helvetica-Bold')
    .text('FLOWBILL', 50, 30)
  doc.fontSize(10).font('Helvetica')
    .text(factura.empresa.nombre, 50, 60)
    .text(`RNC: ${factura.empresa.rnc}`, 50, 75)
    .text(factura.empresa.telefono || '', 50, 90)

  doc.fontSize(22).font('Helvetica-Bold')
    .text('FACTURA', 350, 30, { align: 'right' })
  doc.fontSize(10).font('Helvetica')
    .text(`N°: ${factura.numero}`, 350, 60, { align: 'right' })
  if (factura.ncf) {
    doc.text(`NCF: ${factura.ncf}`, 350, 75, { align: 'right' })
  }
  doc.text(`Fecha: ${new Date(factura.fecha).toLocaleDateString('es-DO')}`, 350, 90, { align: 'right' })

  // ── Info cliente ─────────────────────────────────────────────────────────────
  doc.fillColor(colorNegro).fontSize(11).font('Helvetica-Bold')
    .text('FACTURADO A:', 50, 145)
  doc.fontSize(10).font('Helvetica').fillColor(colorGris)

  if (factura.cliente) {
    doc.text(factura.cliente.nombre, 50, 162)
    if (factura.cliente.rnc) doc.text(`RNC: ${factura.cliente.rnc}`, 50, 177)
    if (factura.cliente.cedula) doc.text(`Cédula: ${factura.cliente.cedula}`, 50, 192)
    if (factura.cliente.email) doc.text(factura.cliente.email, 50, 207)
    if (factura.cliente.telefono) doc.text(factura.cliente.telefono, 50, 222)
  } else {
    doc.text('Consumidor Final', 50, 162)
  }

  doc.fillColor(colorGris).fontSize(10)
    .text(`Estado: ${factura.estado}`, 350, 145)
    .text(`Cajero: ${factura.usuario.nombre}`, 350, 162)

  // ── Tabla de items ────────────────────────────────────────────────────────────
  const tablaY = 260
  doc.rect(50, tablaY, doc.page.width - 100, 24).fill(colorPrimario)
  doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
    .text('PRODUCTO', 58, tablaY + 7)
    .text('CANT.', 290, tablaY + 7, { width: 50, align: 'center' })
    .text('PRECIO', 345, tablaY + 7, { width: 70, align: 'right' })
    .text('DESC.', 420, tablaY + 7, { width: 50, align: 'right' })
    .text('SUBTOTAL', 470, tablaY + 7, { width: 75, align: 'right' })

  let y = tablaY + 30
  factura.items.forEach((item, i) => {
    if (i % 2 === 0) doc.rect(50, y - 4, doc.page.width - 100, 22).fill('#F9FAFB')
    doc.fillColor(colorNegro).fontSize(9).font('Helvetica')
      .text(item.producto.nombre, 58, y, { width: 225 })
      .text(item.cantidad.toString(), 290, y, { width: 50, align: 'center' })
      .text(`$${Number(item.precio).toFixed(2)}`, 345, y, { width: 70, align: 'right' })
      .text(`$${Number(item.descuento).toFixed(2)}`, 420, y, { width: 50, align: 'right' })
      .text(`$${Number(item.subtotal).toFixed(2)}`, 470, y, { width: 75, align: 'right' })
    y += 22
  })

  // ── Totales ────────────────────────────────────────────────────────────────
  y += 15
  doc.moveTo(350, y).lineTo(doc.page.width - 50, y).stroke(colorLinea)
  y += 10

  const totalesX = 350
  const valorX = 440

  doc.fillColor(colorGris).fontSize(10).font('Helvetica')
    .text('Subtotal:', totalesX, y)
    .text(`$${Number(factura.subtotal).toFixed(2)}`, valorX, y, { width: 105, align: 'right' })
  y += 18

  if (Number(factura.descuento) > 0) {
    doc.text('Descuento:', totalesX, y)
      .text(`-$${Number(factura.descuento).toFixed(2)}`, valorX, y, { width: 105, align: 'right' })
    y += 18
  }

  doc.text('ITBIS (18%):', totalesX, y)
    .text(`$${Number(factura.itbis).toFixed(2)}`, valorX, y, { width: 105, align: 'right' })
  y += 10

  doc.moveTo(350, y + 8).lineTo(doc.page.width - 50, y + 8).stroke(colorLinea)
  y += 18

  doc.fillColor(colorNegro).fontSize(13).font('Helvetica-Bold')
    .text('TOTAL:', totalesX, y)
    .text(`$${Number(factura.total).toFixed(2)}`, valorX, y, { width: 105, align: 'right' })

  // ── Notas ─────────────────────────────────────────────────────────────────
  if (factura.notas) {
    y += 40
    doc.fillColor(colorGris).fontSize(9).font('Helvetica-Oblique')
      .text(`Notas: ${factura.notas}`, 50, y)
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.fontSize(8).fillColor(colorGris).font('Helvetica')
    .text('Generado por FlowBill — Sistema de Facturación', 50, doc.page.height - 50, { align: 'center' })

  doc.end()
}

module.exports = { generarFacturaPdf }
