FROM python:3.12-slim-bookworm
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer fonts-dejavu-core fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir python-docx==1.2.0 lxml==6.0.2
WORKDIR /app
COPY server.py word_edit.py word_structural.py /app/
RUN python -B -c "import server, word_edit, word_structural; print('worker modules ok')"
RUN useradd -r -u 10001 -m -s /usr/sbin/nologin camila
USER camila
ENV PORT=8787 PYTHONUNBUFFERED=1
EXPOSE 8787
CMD ["python", "-B", "/app/server.py"]
