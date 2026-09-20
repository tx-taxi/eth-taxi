FROM node:24-bookworm-slim AS frontend-builder

WORKDIR /app/frontend
RUN apt-get update \
    && apt-get install -y --no-install-recommends rsync \
    && rm -rf /var/lib/apt/lists/*
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:24-bookworm-slim AS source-archive

WORKDIR /source
COPY . .
RUN printf '%s\n' \
      'This archive is generated from the same sanitized Docker build context as the deployed eth.tx.taxi image.' \
      'It intentionally excludes secrets, dependencies, caches, and generated build output.' \
      > SOURCE-ARCHIVE.txt \
    && tar --sort=name --mtime='UTC 1970-01-01' --owner=0 --group=0 --numeric-owner \
      -czf /tmp/eth-taxi-source.tar.gz .

FROM node:24-bookworm-slim

WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY adapter/package.json ./adapter/package.json
RUN cd adapter && npm install --omit=dev --package-lock=false
COPY adapter ./adapter
COPY --from=frontend-builder /app/frontend/dist/mempool/browser ./public
# Keep runtime configuration, theme assets, and the Ethereum favicon available
# even when an Angular build omits the copied resources directory.
COPY --from=frontend-builder /app/frontend/src/resources ./public/resources
COPY --from=source-archive /tmp/eth-taxi-source.tar.gz ./public/source/eth-taxi-source.tar.gz

ENV ETH_ADAPTER_HOST=0.0.0.0
ENV ETH_STATIC_ROOT=/app/public
ENV PORT=8080
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/healthz').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "adapter/server.cjs"]
