# ===========================================================================
# Stage 1: Build TypeScript
# ===========================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install ALL deps; --ignore-scripts prevents "prepare" from running tsc
# before source files are available
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Prune devDependencies for production image
RUN npm prune --omit=dev

# ===========================================================================
# Stage 2: Production runtime
# ===========================================================================
FROM node:20-alpine

# Security: non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy only production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Create logs directory with correct permissions
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

USER appuser

ENV MCP_TRANSPORT=http \
    MCP_PORT=3000 \
    MCP_HOST=0.0.0.0 \
    NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

ENTRYPOINT ["node", "dist/index.js", "--http"]
