#!/bin/bash
# Azure App Service startup command
# Oryx pip-installs deps into antenv — use gunicorn directly, not uv run
gunicorn api.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:${PORT:-8000} \
  --timeout 300 \
  --keep-alive 75 \
  --workers 1
