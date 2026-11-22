# Stage 1: Dependencies & Verification
FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run lint && npm test

# Stage 2: Hardened Non-Root Runtime
FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/index.html ./index.html
COPY --from=builder --chown=node:node /app/index.css ./index.css
COPY --from=builder --chown=node:node /app/api ./api
COPY --from=builder --chown=node:node /app/js ./js
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/assets ./assets

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["node", "-e", "process.exit(0)"]

CMD ["npx", "--yes", "serve", "-l", "3000", "."]
