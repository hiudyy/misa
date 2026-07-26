FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run check:i18n && npm run build && npm run test:dist

FROM node:22-bookworm-slim AS runtime
ARG MISA_COMMIT_SHA=unknown
ENV NODE_ENV=production \
    MISA_COMMIT_SHA=${MISA_COMMIT_SHA}
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/scripts ./scripts
COPY --from=builder --chown=node:node /app/README.md /app/LICENSE ./
RUN mkdir -p /app/dados && chown node:node /app/dados
USER node
VOLUME ["/app/dados"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD ["node", "-e", "process.kill(1, 0)"]
CMD ["node", "dist/index.js"]
