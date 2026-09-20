FROM node:24-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:24-bookworm-slim

WORKDIR /app
COPY adapter/package.json ./adapter/package.json
RUN cd adapter && npm install --omit=dev --package-lock=false
COPY adapter ./adapter
COPY --from=frontend-builder /app/frontend/dist/mempool/browser ./public

ENV ETH_ADAPTER_HOST=0.0.0.0
ENV ETH_STATIC_ROOT=/app/public
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "adapter/server.cjs"]
