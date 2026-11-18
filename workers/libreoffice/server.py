"""Worker aislado de documentos: convierte DOCX a PDF y aplica reemplazos validados."""
import base64
import binascii
import hashlib
import hmac
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import subprocess
import tempfile
import time
import zipfile
from io import BytesIO
from word_edit import editar_word

MAX_SIZE = 1_500_000
MAX_EDIT_JSON = 2_100_000
WINDOW_SECONDS = 120

def signature(secret: str, timestamp: str, body: bytes) -> str:
    data = timestamp.encode("ascii") + b"\n" + body
    return hmac.new(secret.encode("utf-8"), data, hashlib.sha256).hexdigest()

def check_request(secret: str, timestamp: str, supplied: str, body: bytes, now=None, max_body=MAX_SIZE) -> bool:
    if not secret or len(secret) < 32 or len(body) < 4 or len(body) > max_body:
        return False
    if not timestamp.isdecimal():
        return False
    now = int(time.time()) if now is None else now
    if abs(now - int(timestamp)) > WINDOW_SECONDS:
        return False
    return hmac.compare_digest(signature(secret, timestamp, body), supplied)

def validate_docx(data: bytes) -> None:
    if not data.startswith(b"PK\x03\x04"):
        raise ValueError("No es un archivo DOCX")
    with zipfile.ZipFile(BytesIO(data)) as archive:
        paths = set(archive.namelist())
        if "word/document.xml" not in paths or "[Content_Types].xml" not in paths:
            raise ValueError("Faltan partes obligatorias de DOCX")
        if any("vbaproject" in p.lower() or p.endswith(".bin") for p in paths):
            raise ValueError("No se permiten macros o archivos binarios embebidos")
        info = archive.infolist()
        if len(info) > 2500 or len(paths) != len(info):
            raise ValueError("DOCX contiene rutas duplicadas o demasiadas partes")
        if sum(x.file_size for x in info) > 24_000_000:
            raise ValueError("DOCX comprimido sospechoso")
        if any(x.file_size > 1_500_000 and x.compress_size < 1000 for x in info):
            raise ValueError("DOCX contiene compresión sospechosa")

def convert_docx(data: bytes) -> bytes:
    validate_docx(data)
    with tempfile.TemporaryDirectory(prefix="camila-pdf-") as temp:
        base = Path(temp)
        source = base / "entrada.docx"
        source.write_bytes(data)
        profile = base / "profile"
        command = [
            "/usr/bin/soffice", "-env:UserInstallation=file://" + str(profile),
            "--headless", "--norestore", "--nodefault", "--nofirststartwizard",
            "--convert-to", "pdf:writer_pdf_Export", "--outdir", str(base), str(source),
        ]
        try:
            proc = subprocess.run(command, timeout=27, cwd=temp, capture_output=True, check=False,
                                  env={"PATH": "/usr/bin:/bin", "HOME": temp, "LANG": "C.UTF-8"})
        except subprocess.TimeoutExpired as exc:
            raise ValueError("La conversión excedió el tiempo permitido") from exc
        output = base / "entrada.pdf"
        if proc.returncode or not output.exists():
            raise ValueError("No se pudo convertir el documento a PDF")
        pdf = output.read_bytes()
        if not pdf.startswith(b"%PDF-") or len(pdf) < 50 or len(pdf) > 2_500_000:
            raise ValueError("LibreOffice no produjo un PDF válido")
        return pdf

def process_edit_request(raw: bytes) -> bytes:
    """Solo JSON declarativo con un DOCX y reemplazos de texto; nunca código arbitrario."""
    try:
        payload = json.loads(raw)
        if not isinstance(payload, dict) or set(payload) != {"archivoBase64", "operaciones"}:
            raise ValueError("Solicitud inválida")
        encoded = payload["archivoBase64"]
        if not isinstance(encoded, str) or len(encoded) > 2_020_000:
            raise ValueError("Archivo inválido")
        docx_bytes = base64.b64decode(encoded, validate=True)
        if len(docx_bytes) > MAX_SIZE:
            raise ValueError("Word demasiado grande")
        validate_docx(docx_bytes)
        result, count = editar_word(docx_bytes, payload["operaciones"])
        if len(result) > 2_500_000:
            raise ValueError("El archivo resultante excede el límite")
        return json.dumps({"archivoBase64": base64.b64encode(result).decode("ascii"),
                           "operacionesAplicadas": count}, separators=(",", ":")).encode("utf-8")
    except (UnicodeDecodeError, json.JSONDecodeError, binascii.Error, TypeError, KeyError) as exc:
        raise ValueError("Solicitud de edición inválida") from exc


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/health":
            self.send_error(404)
            return
        self._reply(200, b"ok", "text/plain")

    def do_POST(self):
        if self.path not in ("/convert", "/edit"):
            self.send_error(404)
            return
        limit = MAX_SIZE if self.path == "/convert" else MAX_EDIT_JSON
        size_raw = self.headers.get("Content-Length", "")
        if not size_raw.isdecimal() or not (4 <= int(size_raw) <= limit):
            self.send_error(413)
            return
        raw = self.rfile.read(int(size_raw))
        timestamp = self.headers.get("X-Camila-Timestamp", "")
        auth = self.headers.get("X-Camila-Signature", "")
        if not check_request(os.environ.get("CAMILA_PDF_WORKER_SECRET", ""),
                             timestamp, auth, raw, max_body=limit):
            self.send_error(403)
            return
        try:
            if self.path == "/edit":
                result = process_edit_request(raw)
                return self._reply(200, result, "application/json")
            pdf = convert_docx(raw)
            return self._reply(200, pdf, "application/pdf")
        except (ValueError, OSError, zipfile.BadZipFile, zipfile.LargeZipFile):
            self.send_error(422, "No se pudo procesar el Word")

    def _reply(self, status, data, mime):
        self.send_response(status)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, format, *args):
        # Nunca registrar contenidos ni URLs de documentos.
        pass

if __name__ == "__main__":
    if len(os.environ.get("CAMILA_PDF_WORKER_SECRET", "")) < 32:
        raise SystemExit("CAMILA_PDF_WORKER_SECRET debe configurarse")
    ThreadingHTTPServer(("0.0.0.0", int(os.environ.get("PORT", "8787"))), Handler).serve_forever()
