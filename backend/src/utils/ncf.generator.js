/**
 * Genera un NCF (Número de Comprobante Fiscal) dominicano.
 * Formato: prefijo (ej. "B01") + secuencia de 8 dígitos
 * Ejemplo: B0100000001
 */
const generarNcf = (prefijo, secuenciaActual) => {
  const siguiente = secuenciaActual + 1
  return `${prefijo}${String(siguiente).padStart(8, '0')}`
}

/**
 * Valida que el NCF tenga el formato correcto dominicano.
 */
const validarNcf = (ncf) => /^[BE]\d{2}\d{8}$/.test(ncf)

module.exports = { generarNcf, validarNcf }
