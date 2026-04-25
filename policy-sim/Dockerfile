FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencies in a separate layer — only rebuilt when requirements.txt changes
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Application code and required runtime assets
COPY api/ api/
COPY simulation/ simulation/
COPY data/ data/
COPY knowledge_base/ knowledge_base/
COPY .claude/skills/ .claude/skills/

RUN mkdir -p simulation_runs

ENV PORT=8000
EXPOSE 8000

CMD ["/usr/local/bin/gunicorn", "api.main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "600", \
     "--workers", "2", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
