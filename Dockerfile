# syntax=docker/dockerfile:1.4

# ---- Base ----
# Use a specific Node.js Alpine version and update tools
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
# Update apk and npm to potentially newer versions within the image
RUN apk update && apk upgrade && npm install -g npm@latest

# ---- Dependencies ----
# Install ONLY production dependencies using --omit=dev
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- Builder ----
# Install ALL dependencies (including dev) AFTER copying source code and build
FROM base AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY . .
# Install all dependencies needed for the build
RUN npm ci --no-audit --no-fund && npm cache clean --force
ENV NEXT_TELEMETRY_DISABLED=1
# Run the build - this is where the alias resolution needs to work
RUN npm run build

# ---- Runner ----
# Final stage with application code, production dependencies, and built assets
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from previous stages
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

# Basic healthcheck to see if the server starts
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start the application using the standard Next.js start command
CMD ["npm", "start"]
