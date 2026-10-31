# DOCENTY PRO · Opciones de Claude (administrador / desarrollo)

**Estado:** las integraciones permanecen apagadas por defecto incluso en producción. Su activación explícita se limita a cuentas administradoras y archivos ficticios; no son funciones disponibles para los 69 docentes.

## 1. Skill Word (Anthropic)

Flujo: aprobación explícita del administrador con Word **ficticio** → `POST /api/camila-docx-skills` (sesión Supabase verificada) → `POST /v1/files` → `POST /v1/messages` con `container.skills = [{type:'anthropic',skill_id:'docx'}]` y `code_execution_20250825` → Files API para recuperar el DOCX → borrado inmediato de archivos de origen y salida → propuesta **sin aplicar** hasta su aprobación en Camila.

- Las Skills de código **no son ZDR** y el contenedor puede conservar información hasta **30 días**, incluso después de borrar los archivos en Files API.
- El espacio de archivos de Anthropic es por workspace, no por usuario final; antes de implementar para docentes reales debe diseñarse aislamiento real de tenants y consentimiento separado.
- Solo para pruebas con documentación ficticia, sin nombres de estudiantes, matrículas, diagnósticos personales ni credenciales.
- El navegador **nunca** recibe ni envía `ANTHROPIC_API_KEY` ni un `file_id` proporcionado por otros usuarios.
- Se requiere `CAMILA_DOCX_SKILLS_ENABLED=true` para el entorno habilitado, `ANTHROPIC_API_KEY` en servidor y `VITE_CAMILA_SKILLS_TOOLS=true` en el build para mostrar solo el botón Skill al administrador. `VITE_CAMILA_OPTIONAL_TOOLS=true` sigue siendo un interruptor de compatibilidad que muestra ambos botones. En producción solo se permite para pruebas de administrador con archivos ficticios y consentimiento explícito; no activar globalmente para docentes.
- El resultado requiere revisión visual, pedagógica y aprobación expresa; no se promete idéntica fidelidad de una plantilla arbitraria.
- Los tests de API ejecutan una simulación determinista sin cargos; **una llamada real pagada aún requiere verificación**.

## 2. Vista PDF fiel con LibreOffice

Flujo: DOCX aprobado o propuesta → autorización del administrador → `POST /api/camila-preview-pdf` → cuerpo binario firmado por HMAC SHA256 desde servidor Vercel → worker LibreOffice aislado → PDF en memoria → iframe temporal (no se guarda por defecto).

- El PDF es **vista previa**, no modifica el Word original.
- `workers/libreoffice` contiene Dockerfile + servicio Python sin base de datos. La prueba CI instala LibreOffice y convierte un Word ficticio a PDF.
- En Preview configurar `CAMILA_LIBREOFFICE_PREVIEW_ENABLED=true`; en Production el interruptor diferente es `CAMILA_LIBREOFFICE_ENABLED=true`, y para mostrar su botón admin `VITE_CAMILA_LIBREOFFICE_TOOLS=true`. Ambos requieren `CAMILA_PDF_WORKER_URL=https://dominio-aprobado/convert` y `CAMILA_PDF_WORKER_SECRET` (secreto aleatorio de mínimo 32 caracteres). El worker requiere el mismo secreto.
- Configurar dominio HTTPS no público, aislamiento de red, TLS, recursos, tamaño máximo y monitoreo antes de desplegar en DigitalOcean u otro servidor. **No se ha creado un servidor nuevo, no hay gastos de hosting nuevos.**
- DOCX máximo 1.5MB y PDF máximo 2.5MB para no superar límites de Vercel.
- Los archivos se procesan en directorio temporal y se eliminan al responder. No activar para datos reales hasta terminar revisión de privacidad.

## Criterios de lanzamiento

1. Las pruebas automatizadas y compilación deben estar verdes en la rama.
2. Probar un DOCX ficticio con tablas, logo y pies de página; comparar visualmente el PDF frente al Word original.
3. Probar la Skill pagada con un DOCX ficticio y revisar/eliminar todos los archivos, sin exponer datos reales.
4. Verificar RLS y cuotas; administrar consentimiento real y tenant separation.
5. Aprobar costos del worker y despliegue aislado, sin reutilizar servidores de otras aplicaciones sin permiso.
6. Solo después considerar un PR a `main`, con autorización explícita del dueño.

Referencias:
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/quickstart
- https://platform.claude.com/docs/en/build-with-claude/files
- https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool
