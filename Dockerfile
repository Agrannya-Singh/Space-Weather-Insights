# syntax=docker/dockerfile:1.4

# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# ---- Dependencies ----
# Install ONLY production dependencies first to leverage cache if possible
# Although this layer might not be used directly by the final image if
# build dependencies affect the final node_modules structure significantly.
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --only=production --no-audit --no-fund

# ---- Builder ----
# Install ALL dependencies (including dev) AFTER copying source code
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY . .  # Copy source code including tsconfig.json etc. FIRST
RUN npm ci --no-audit --no-fund # Install ALL dependencies based on lock file
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
# Copy production node_modules from the dedicated 'deps' stage
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY package.json ./

# Copy built application files from the 'builder' stage
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT 3000

# Start the application using the standard Next.js start command
CMD ["npm", "start"]
