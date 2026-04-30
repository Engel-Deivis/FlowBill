/**
 * main.js — Punto de entrada de la aplicación FlowBill
 *
 * Este archivo es el módulo raíz importado por index.html.
 * Su única responsabilidad es iniciar el router, que a su vez decide
 * qué página mostrar según la sesión activa y el hash de la URL.
 *
 * Toda la lógica de autenticación, navegación y renderizado está en router.js.
 */

import { router } from './router.js'

// Arranca la SPA: lee el hash actual y navega a la ruta correspondiente
router.init()
