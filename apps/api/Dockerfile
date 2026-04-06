FROM debian:bookworm-slim AS builder

ENV MISE_DATA_DIR=/mise
ENV MISE_CONFIG_DIR=/mise
ENV MISE_CACHE_DIR=/mise/cache
ENV MISE_INSTALL_PATH=/usr/local/bin/mise
ENV PATH=/mise/shims:$PATH

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash curl ca-certificates xz-utils \
  && rm -rf /var/lib/apt/lists/* \
  && curl https://mise.run | sh

COPY mise.toml /app/mise.toml

RUN mise trust --yes /app/mise.toml \
  && mise install \
  && mise reshim

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build shared packages used by the API and compile-check the API app.
RUN pnpm --filter @braille-docs/db build \
  && pnpm --filter @braille-docs/shared build \
  && pnpm --filter @braille-docs/editor-schema build \
  && pnpm --filter @braille-docs/api typecheck

FROM debian:bookworm-slim AS runner

ENV MISE_DATA_DIR=/mise
ENV MISE_CONFIG_DIR=/mise
ENV MISE_CACHE_DIR=/mise/cache
ENV MISE_INSTALL_PATH=/usr/local/bin/mise
ENV PATH=/mise/shims:$PATH

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
COPY --from=builder /mise /mise
COPY --from=builder /usr/local/bin/mise /usr/local/bin/mise

EXPOSE 3001

CMD ["node", "--import", "tsx", "apps/api/src/index.ts"]
