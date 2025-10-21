# syntax=docker/dockerfile:1.4

# ---- Base ----
# Use a specific Node.js version on Alpine for smaller images
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production


# ---- Dependencies ----
# Install ONLY production dependencies in a separate stage for caching
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production --no-audit --no-fund


# ---- Builder ----
# Install ALL dependencies (including dev) and build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build


# ---- Runner ----
# Final stage with application code, production dependencies, and built assets
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from previous stages
# Copy production node_modules first
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY package.json ./

# Copy built application files
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Start the application using the standard Next.js start command
CMD ["npm", "start"]
