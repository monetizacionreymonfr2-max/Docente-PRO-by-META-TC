FROM python:3.12-slim-bookworm
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer fonts-dejavu-core fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY server.py /app/server.py
RUN useradd -r -u 10001 -m -s /usr/sbin/nologin camila
USER camila
ENV PORT=8787 PYTHONUNBUFFERED=1
EXPOSE 8787
CMD ["python", "-B", "/app/server.py"]
