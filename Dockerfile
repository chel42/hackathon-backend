# Multi-stage Dockerfile optimized for small production image

# Builder
FROM node:20-slim AS builder
WORKDIR /app

# Install OS packages needed for native builds and Prisma
RUN apt-get update && apt-get install -y build-essential python3 openssl libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy package files and install all deps needed for building
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy sources
COPY . .

# Generate Prisma client and build TypeScript
RUN npm run prisma:generate
RUN npm run build

# Bundle into a single JS file to reduce runtime footprint
RUN npm run bundle

# Ensure proper ownership for non-root user
RUN chown -R node:node /app

# Runner (slim, production-only deps)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies in the runtime image
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# Copy bundled artifact and Prisma artifacts
COPY --from=builder /app/dist-bundle ./dist-bundle
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Expose port and prepare runtime directories
EXPOSE 3000
RUN mkdir -p /app/logs /app/uploads/pdfs && chown -R node:node /app/logs /app/uploads

# Run as non-root
USER node

# Default command (run bundle)
CMD ["node", "dist-bundle/index.js"]
