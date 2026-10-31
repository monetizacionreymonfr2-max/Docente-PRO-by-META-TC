"""Worker de conversión DOCX->PDF. Sin dependencias de Python ni exposición de secretos."""
import hashlib
import hmac
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import subprocess
import tempfile
import time
import zipfile
from io import BytesIO

MAX_SIZE = 1_500_000
WINDOW_SECONDS = 120

def signature(secret: str, timestamp: str, body: bytes) -> str:
    data = timestamp.encode("ascii") + b"\n" + body
    return hmac.new(secret.encode("utf-8"), data, hashlib.sha256).hexdigest()

def check_request(secret: str, timestamp: str, supplied: str, body: bytes, now=None) -> bool:
    if not secret or len(secret) < 32 or len(body) < 4 or len(body) > MAX_SIZE:
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
        if sum(x.file_size for x in archive.infolist()) > 24_000_000:
            raise ValueError("DOCX comprimido sospechoso")

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
        if not pdf.startswith(b"%PDF-") or len(pdf) < 50 or len(pdf) > 14_000_000:
            raise ValueError("LibreOffice no produjo un PDF válido")
        return pdf

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != "/health":
            self.send_error(404)
            return
        self._reply(200, b"ok", "text/plain")

    def do_POST(self):
        if self.path != "/convert":
            self.send_error(404)
            return
        size_raw = self.headers.get("Content-Length", "")
        if not size_raw.isdecimal() or not (4 <= int(size_raw) <= MAX_SIZE):
            self.send_error(413)
            return
        raw = self.rfile.read(int(size_raw))
        timestamp = self.headers.get("X-Camila-Timestamp", "")
        auth = self.headers.get("X-Camila-Signature", "")
        if not check_request(os.environ.get("CAMILA_PDF_WORKER_SECRET", ""), timestamp, auth, raw):
            self.send_error(403)
            return
        try:
            pdf = convert_docx(raw)
        except (ValueError, OSError, zipfile.BadZipFile):
            self.send_error(422, "No se pudo convertir el Word")
            return
        self._reply(200, pdf, "application/pdf")

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
