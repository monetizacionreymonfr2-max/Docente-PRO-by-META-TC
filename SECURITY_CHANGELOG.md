# Revisión de seguridad (cambio propuesto, NO desplegado)

- Eliminada la sustitución de `process.env.GEMINI_API_KEY` en Vite; antes podía publicar la clave en el bundle.
- Las llamadas `generateContentWithRetry` ahora usan `/api/generate` con sesión Supabase; la función serverless verifica el JWT mediante `auth.getUser` y usa `GEMINI_API_KEY` solo en el servidor.
- Gemini Live se deshabilita temporalmente porque requiere un intermediario seguro de sesiones/credenciales efímeras. El chat escrito permanece disponible para usuarios autenticados.
- El catálogo de modelos usa su lista local de respaldo, sin consultar Gemini desde el navegador.

## Riesgos pendientes antes de producción

1. **Crítico:** `server.ts` contiene endpoints `/api/admin/*` que usan `SUPABASE_SERVICE_ROLE_KEY` sin middleware de autorización de administrador. No exponer ese servidor a Internet hasta protegerlos. En la configuración Vercel del ZIP, `server.ts` no parece ser la función desplegada; confirmar infraestructura real.
2. Los endpoints `/api/formatos/*` de `server.ts` no están migrados a funciones Vercel. Validar flujos de «Mi Formato» en Preview antes de fusionar.
3. El chat de ventas sin sesión y las funciones que dependan de Gemini Live requieren diseño adicional de acceso controlado; no abrir el proxy a visitantes anónimos sin límites y protecciones contra abuso.
4. Configurar `GEMINI_API_KEY` solo en variables privadas de Vercel (sin prefijo `VITE_`). Para el endpoint, también `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` deben estar disponibles al runtime del servidor; son parámetros públicos de Supabase, no secretos.
5. No se ha ejecutado una prueba integrada ni desplegado Preview. Revisar las reglas de autorización, cuotas, límites de petición y pruebas antes de producción.

## Desarrollo

No se ha cambiado Supabase, Vercel ni GitHub. Probar con `npm ci`, `npm run lint`, `npm run build`, y desplegar una rama a Vercel Preview; validar generación autenticada y verificar que ninguna clave privada aparezca en `dist`.
