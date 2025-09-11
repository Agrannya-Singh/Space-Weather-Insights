# syntax=docker/dockerfile:1

# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps separately for better caching
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build Next.js
ENV NODE_ENV=production
RUN npm run build

# 2) Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

# Copy only necessary artifacts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install production deps only
RUN npm ci --only=production --no-audit --no-fund

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
