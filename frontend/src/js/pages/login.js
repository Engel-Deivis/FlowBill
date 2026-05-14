/**
 * login.js — Página de inicio de sesión
 *
 * Muestra el formulario de login, gestiona el estado visual del botón
 * (cargando / error / éxito) y redirige al dashboard tras autenticarse.
 *
 * Campos:
 *   - empresaId: identificador único de la empresa (multi-tenant)
 *   - email:     correo del usuario
 *   - password:  contraseña (el toggle muestra/oculta el texto)
 *
 * Seguridad:
 *   - El token JWT se persiste via auth.save() en localStorage (ver client.js).
 *   - Los mensajes de error del servidor se muestran en #login-error-msg sin
 *     insertar HTML — se usa textContent para evitar XSS.
 *   - No se loggea ni el email ni la contraseña.
 */

import { api, auth } from '../api/client.js'
import { router }    from '../router.js'

/* HTML completo de la pantalla de login — incluye estilos inline y animaciones. */
import loginHTML from '../../pages/login.html?raw'

/**
 * Punto de entrada de la pantalla de login.
 * Inyecta el HTML en #app (no en #main, porque el login no tiene sidebar).
 */
export function renderLogin() {
  document.getElementById('app').innerHTML = loginHTML

  // Toggle de visibilidad del campo contraseña
  document.getElementById('toggle-pass').addEventListener('click', () => {
    const inp = document.getElementById('password')
    inp.type  = inp.type === 'password' ? 'text' : 'password'
  })

  // Envío del formulario de login
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault() // Previene recarga de página

    // Referencias a elementos del DOM que se actualizan durante la carga
    const btn     = document.getElementById('btn-login')
    const btnText = document.getElementById('btn-text')
    const arrow   = document.getElementById('btn-arrow')
    const spinner = document.getElementById('btn-spinner')
    const errEl   = document.getElementById('login-error')
    const errMsg  = document.getElementById('login-error-msg')

    // Lee valores del formulario (trim para evitar espacios accidentales)
    const empresaId = document.getElementById('empresaId').value.trim()
    const email     = document.getElementById('email').value.trim()
    const password  = document.getElementById('password').value

    // Estado visual: botón deshabilitado + spinner visible
    btn.disabled          = true
    btnText.textContent   = 'Verificando...'
    arrow.style.display   = 'none'
    spinner.style.display = 'block'
    errEl.style.display   = 'none'

    try {
      const data = await api.login({ empresaId, email, password })

      // Persiste el token y el perfil del usuario en localStorage
      auth.save(data.token, data.user)

      // Feedback visual de éxito antes de redirigir
      btnText.textContent    = '¡Acceso concedido!'
      btn.style.background   = '#10B981'

      // Pequeña pausa para que el usuario vea la confirmación visual
      setTimeout(() => router.go('dashboard'), 400)

    } catch (err) {
      // Muestra el mensaje de error sin insertar HTML (textContent, no innerHTML)
      errMsg.textContent    = err.message || 'Credenciales incorrectas.'
      errEl.style.display   = 'flex'

      // Restaura el botón para reintentar
      btn.disabled          = false
      btnText.textContent   = 'Iniciar sesión'
      arrow.style.display   = 'block'
      spinner.style.display = 'none'
    }
  })
}
