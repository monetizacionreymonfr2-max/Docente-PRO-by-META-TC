#!/usr/bin/env bash
# Ejecutar manualmente SOLO en el droplet QA una vez aprobada la preparación.
# No usa credenciales de producción ni cambia variables de Vercel.
set -euo pipefail
cd "$(dirname "$0")"
bash ./qa-preflight.sh
if [[ "$(hostname)" != "docenty-libreoffice-qa-20261030" ]]; then
  echo "ERROR: destino distinto de worker de QA" >&2
  exit 2
fi

echo "Construyendo y arrancando únicamente el servicio QA de DOCENTY PRO..."
docker compose up -d --build
# Confirmar la salud del servicio interno, sin enviar archivos de docentes.
if ! docker compose exec -T converter python -B -c \
  'from urllib.request import urlopen; assert urlopen("http://127.0.0.1:8787/health", timeout=8).status == 200'; then
  echo "ERROR: el worker QA no responde a /health. Revisar logs locales del servidor." >&2
  exit 5
fi
echo "Worker QA arrancado. Antes de activar Vercel, validar HTTPS externo y firma HMAC."
