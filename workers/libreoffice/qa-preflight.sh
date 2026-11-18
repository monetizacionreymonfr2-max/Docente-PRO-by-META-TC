#!/usr/bin/env bash
# Comprobación de preparación del droplet de QA. No despliega ni modifica producción.
set -euo pipefail
cd "$(dirname "$0")"

if [[ "$(hostname)" != "docenty-libreoffice-qa-20261030" ]]; then
  echo "ERROR: ejecutar únicamente en el droplet QA designado." >&2
  exit 2
fi
if [[ ! -f .env ]]; then
  echo "ERROR: falta workers/libreoffice/.env privado." >&2
  exit 3
fi
if [[ $(stat -c '%a' .env) != "600" ]]; then
  echo "ERROR: chmod 600 .env antes de continuar." >&2
  exit 3
fi
for key in WORKER_DOMAIN CAMILA_PDF_WORKER_SECRET; do
  if ! grep -qE "^$key=.+" .env; then
    echo "ERROR: falta la variable $key en .env (no imprima su valor)." >&2
    exit 3
  fi
done
if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker no está instalado." >&2
  exit 4
fi
docker info >/dev/null
docker compose version >/dev/null
docker compose config --quiet
echo "Comprobación QA aprobada: host, permisos, variables presentes y Docker Compose válido."
echo "No se ha desplegado ningún contenedor ni cambiado ninguna variable de producción."
