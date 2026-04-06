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

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY apps/admin/package.json apps/admin/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/editor-schema/package.json packages/editor-schema/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @braille-docs/db build \
  && pnpm --filter @braille-docs/editor-schema build \
  && pnpm --filter @braille-docs/shared build \
  && pnpm --filter @braille-docs/admin build

FROM nginx:1.29.7-alpine AS runner

ENV PORT=8080

RUN apk add --no-cache gettext

COPY apps/admin/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
