# Worker de documentos Word/PDF — DOCENTY PRO (experimental)

Este directorio contiene un servicio aislado de conversión Word→PDF con LibreOffice y edición DOCX mediante Python. No se ha verificado un worker desplegado y habilitado en Preview; no toca `main` ni Supabase.

## Protocolo y seguridad
- `POST /convert`: cuerpo DOCX binario, tamaño máximo 1.5 MB.
- Cabeceras `X-Camila-Timestamp` (Unix segundos) y `X-Camila-Signature` (HMAC SHA256 hex de `timestamp + "\\n" + bytes`).
- `CAMILA_PDF_WORKER_SECRET` debe ser un secreto aleatorio (mínimo 32 caracteres), distinto a las claves de Anthropic y Supabase.
- Rechaza solicitudes caducadas (más de 120 segundos), documentos con macros, zip bombs y contenido no DOCX.
- LibreOffice se ejecuta sin interfaz y con un perfil nuevo por operación; un directorio temporal se elimina al terminar la petición.
- En infraestructura externa, **no exponer el puerto al público**: usar TLS/mTLS, firewall y un dominio interno exclusivamente accesible desde la función de Vercel. No ejecutar en el servidor de otra app sin permiso.
- El proxy de Vercel mantiene la autorización por sesión, no devuelve nombres de archivo y no registra datos del docente.

## Inicio local (solo datos ficticios)
`docker build -t camila-libreoffice ./workers/libreoffice`
`docker run --rm -p 127.0.0.1:8787:8787 -e CAMILA_PDF_WORKER_SECRET=VALOR_ALEATORIO_DE_32_CARACTERES_O_MAS camila-libreoffice`

La API se mantiene apagada si falta el interruptor específico de cada entorno y `CAMILA_PDF_WORKER_URL` (URL HTTPS aprobada) en Vercel. En producción solo puede activarse para administradores con documentos ficticios; no habilitarla para docentes.

## Servicio aislado en DigitalOcean

`compose.yaml` publica únicamente Caddy en 80/443. LibreOffice se ejecuta como usuario sin privilegios, sin puerto público, con límite de memoria, sistema de archivos de solo lectura y `/tmp` temporal. Caddy obtiene el certificado TLS del dominio configurado.

Preparar en el host un archivo `.env` privado (permisos 600) en este directorio con:

```dotenv
WORKER_DOMAIN=dominio-del-worker.example.com
CAMILA_PDF_WORKER_SECRET=secreto-aleatorio-de-32-caracteres-o-mas
```

Iniciar con `docker compose up -d --build` y comprobar `https://DOMINIO/health`. La ruta `/convert` requiere HMAC válido y un archivo DOCX; nunca abrir el puerto 8787 a Internet. No registrar archivos ni enviar documentos reales durante las pruebas.


## Edición DOCX experimental (Mi Formato)

El worker también implementa `POST /edit`, **apagado en la aplicación salvo que el proxy de Preview lo habilite explícitamente**. No es un entorno de Python remoto para el modelo: el modelo propone un JSON y el worker ejecuta exclusivamente operaciones declarativas permitidas: reemplazar_texto, set_parrafo, set_celda, agregar_filas, reemplazar_filas y set_seccion. No se puede enviar código para ejecutar.

- Endpoint de Vercel: `/api/camila-edit-docx`, solo cuando `VERCEL_ENV=preview` y `CAMILA_DOCX_EDIT_PREVIEW_ENABLED=true`.
- Requiere sesión administradora validada en servidor, `consentimiento=true` y `soloFicticio=true`. **No enviar datos reales de niños o docentes en esta etapa.**
- Reutiliza `CAMILA_PDF_WORKER_URL=https://DOMINIO/convert` y `CAMILA_PDF_WORKER_SECRET` (no se exponen al navegador). El proxy cambia la ruta a `/edit` y firma el cuerpo exacto con HMAC SHA-256 y ventana de 120 segundos.
- Solicitud al proxy: `{"archivoBase64":"<base64-docx>","operaciones":[{"tipo":"reemplazar_texto","buscar":"Texto original único","reemplazar":"Nuevo texto"}],"consentimiento":true,"soloFicticio":true}`.
- Respuesta: `{"archivoBase64":"<base64-docx>","operacionesAplicadas":1,"mimeType":"application/vnd.openxmlformats-officedocument.wordprocessingml.document"}`.
- Restricciones: tamaño original máximo 1.5 MB, hasta 20 cambios por solicitud, coincidencias de texto únicas por documento; rechaza reemplazos ambiguos, elementos complejos, macros y ZIP sospechosos. No modifica encabezados, pies, logos ni archivos ajenos a `word/document.xml`; un fallo invalida toda la solicitud.
- Se puede usar en trabajos de prueba con archivos ficticios. **Existe una prueba manual y un flujo conversacional Gemini + Python restringido a Preview, administradores y documentos ficticios; sin activar las variables ni desplegar el worker, ambos permanecen inactivos.**
- Herramientas Python: python-docx para abrir/verificar y lxml para modificar texto de OOXML de forma localizada. LibreOffice sigue sirviendo para la conversión de vista previa.

Pruebas: `python -m unittest discover -s tests -p 'test_word_edit_worker.py' -v`. Si falta alguna dependencia local: `python -m pip install python-docx==1.2.0 lxml==6.0.2`.

### Límites conocidos

Este editor **no es** todavía un clon del entorno de ChatGPT. El procesador admite texto inequívoco, párrafos, celdas simples, inserción/reemplazo de filas compatibles y edición de párrafos consecutivos. Rechaza celdas combinadas, imágenes en filas, campos y diseños que no puede preservar. No genera un PPA completo por sí solo ni garantiza idéntica paginación; requiere revisión visual. Revisar visualmente cada DOCX antes de utilizarlo oficialmente.


## Integración conversacional Gemini + Python (segunda fase experimental)

El chat **Camila Formato** permite, bajo `VITE_CAMILA_DOCX_EDIT_TOOLS=true`, activar manualmente **«Gemini + Python: prueba activa»** después de confirmar que el Word actual contiene solo datos ficticios. Al abrir otro archivo se desactiva el modo.

- La planificación se solicita al endpoint `/api/camila-gemini-formato`, con el motor Gemini del servidor (no Claude). Este endpoint está cerrado salvo en Preview con `CAMILA_GEMINI_FORMATO_PREVIEW_ENABLED=true`; requiere sesión administradora. Usa `GEMINI_API_KEY` exclusivamente en servidor y `CAMILA_FORMATO_GEMINI_MODEL` opcional (predeterminado: `gemini-2.5-flash`). No se envían adjuntos binarios al planificador, solo texto/mapa de la sesión ficticia.
- Gemini devuelve JSON con operaciones `set_parrafo`, `set_celda`, `agregar_filas`, `reemplazar_filas` y `set_seccion`, o ninguna operación y una explicación. La capa de DOCENTY PRO verifica IDs de párrafos y celdas, limita las operaciones a celdas de contenido que tengan un solo párrafo y excluye etiquetas fijas.
- El navegador convierte cada operación compatible a una instrucción para Python con `esperado` (texto anterior). El worker comprueba esa precondición antes de modificar la copia del Word. Así se evitan escrituras sobre documentos desactualizados.
- Se vuelve a abrir el DOCX devuelto, se comprueba su integridad y se actualiza la vista previa con **Deshacer** disponible, sin la aprobación repetitiva previa para este flujo específico.
- La fase 3 experimental permite insertar/reemplazar semanas en cronogramas y corregir bloques contiguos de una sección, bajo verificaciones de integridad. La generación íntegra de un PPA, las celdas combinadas y los documentos reales siguen fuera del alcance.

### Configuración de Preview únicamente

Vercel (API/servidor): `CAMILA_DOCX_EDIT_PREVIEW_ENABLED=true`, `CAMILA_GEMINI_FORMATO_PREVIEW_ENABLED=true`, `CAMILA_PDF_WORKER_URL=https://TU_HOST/convert`, `CAMILA_PDF_WORKER_SECRET=<secreto fuerte>`, `GEMINI_API_KEY=<clave privada>`. Vercel (compilación cliente): `VITE_CAMILA_DOCX_EDIT_TOOLS=true`. Configurar solo tras el despliegue y la revisión del worker en DigitalOcean. Nunca crear variables `VITE_` con secretos. Ningún cambio de estas variables fue realizado automáticamente por este PR.

**Pendiente para uso real:** despliegue controlado del contenedor, pruebas extremo a extremo con documentos ficticios de varios formatos, control de costos y migración del flujo completo de PPA/planificaciones. El chat general y las rutas de producción no se modifican.
