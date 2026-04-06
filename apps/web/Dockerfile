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
  && mise reshim \
  && ln -sf "$(mise where node)/bin/node" /usr/local/bin/node

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @braille-docs/db build \
  && pnpm --filter @braille-docs/shared build \
  && pnpm --filter @braille-docs/web build

FROM debian:bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app
COPY --from=builder /mise/installs /mise/installs
COPY --from=builder /usr/local/bin/node /usr/local/bin/node

EXPOSE 4321

CMD ["node", "apps/web/dist/server/entry.mjs"]
