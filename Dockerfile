# ── Stage 1: build the static site ──────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /build

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
RUN mkdocs build --strict

# ── Stage 2: serve with Caddy ─────────────────────────────────────────────────
# Traefik (the reverse proxy) sits in front; Caddy is the static file origin.
FROM caddy:2-alpine

# Copy the built site
COPY --from=builder /build/site /srv

# Caddy config — reads $PORT from the environment (Railway injects it)
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
