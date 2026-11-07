# DOCENTY PRO — control de consumo de Gemini (preparación)

Estado: **no habilitar las cuotas en producción ni compartir la clave de servicio**.

## Situación comprobada el 7 de noviembre de 2026

- El propietario informa **129 docentes activos** en DOCENTY PRO. Esta cifra
  no equivale a 129 llamadas concurrentes ni permite deducir la cuota de Google.
- Mi Formato y el endpoint de Gemini siguen reservados temporalmente a los
  administradores, incluso para usuarios con licencia Pro.
- El proyecto Supabase existente tiene las tablas de cuotas y métricas, pero
  actualmente no tiene filas de cuotas ni registros de consumo.
- Falta configurar una credencial privada de servidor en un entorno **aislado de
  producción**; encender `CAMILA_CUOTAS_ACTIVAS=true` sin ella provoca HTTP 503.
- Las pruebas automatizadas comprueban límites diarios, mensuales y el bloqueo
  antes de facturar la llamada a Gemini; la reserva es una estimación
  conservadora de entrada + instrucciones + esquema + salida máxima.

## Cómo activar cuando exista un entorno de prueba independiente

1. Confirmar la capacidad real RPM/TPM/RPD, el nivel de facturación y los
   límites por modelo en Google AI Studio. Ningún número se debe inferir de la
   cantidad de docentes registrados.
2. Preparar un **proyecto Supabase exclusivo de pruebas**, sin credenciales de
   la base compartida por los docentes. Aplicar allí las migraciones de Camila.
3. Crear únicamente las cuotas de las **cuentas ficticias de prueba** en
   `camila_cuotas`, con cupos mensuales y diarios explícitos acordados con el
   propietario. No crear presupuestos reales por plan sin aprobarlos.
4. Configurar en Vercel Preview para la rama de pruebas:
   - `SUPABASE_URL` (base de pruebas).
   - `SUPABASE_ANON_KEY` (clave pública de la base de pruebas).
   - `SUPABASE_SERVICE_ROLE_KEY` (**Secret** solo del servidor, sin `VITE_`).
   - `CAMILA_CUOTAS_ACTIVAS=true` (solo Preview, después de los tres pasos
     anteriores).
5. Redesplegar Preview. Comprobar una solicitud permitida, el registro de solo
   tokens y una denegación HTTP 429 **sin enviar solicitud a Gemini** al
   alcanzar cada límite. Revisar que `service_role` no aparezca en JS público.
6. Antes de habilitar a los docentes, implementar **reserva atómica en base de
   datos** por usuario. La comprobación actual por lectura y posterior registro
   no es una garantía de gasto máximo con solicitudes simultáneas.
7. Solicitar autorización específica del propietario para activar cuotas o
   modificar cualquier dato, secreto o despliegue de producción.

Mientras no exista una base de prueba aislada, se pueden ejecutar pruebas
locales con credenciales y respuestas simuladas sin costos adicionales:

```sh
npm run test:gemini
npm run test:ppa-completo
npm run lint
```

No utilizar `CAMILA_CUOTAS_ACTIVAS=true` como solución parcial con la base de
producción: podría bloquear a Camila o registrar pruebas en cuentas reales.
