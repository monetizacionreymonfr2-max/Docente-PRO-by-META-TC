# Worker opcional de vista previa PDF (DOCENTY PRO)

Este directorio es una pieza aislada para previsualizar DOCX como PDF mediante LibreOffice. **No está desplegada** y no toca `main` ni Supabase.

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
