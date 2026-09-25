# Interim deploy: the full gatcha Next app was never committed to GitHub; prod
# still runs a cached image from a local-only magic-gatcha tree (Sep 2026).
# This Caddy reverse proxy keeps the clone gatcha service online on the new project
# until the real app is restored (Railway duplicate-service or recommit source).
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
ENV GATCHA_UPSTREAM=https://gatcha-production-a07c.up.railway.app
ENV PORT=8080
EXPOSE 8080
