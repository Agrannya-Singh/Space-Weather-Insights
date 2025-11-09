# syntax=docker/dockerfile:1.4

# ==================================================================
# Stage 1: The "Builder" Stage (This is still perfect)
# ==================================================================
FROM node:20-slim AS builder
WORKDIR /app

# 1. Install all dependencies
COPY package.json package-lock.json ./
RUN npm ci

# 2. Copy the rest of the source code
COPY . .

# 3. Set Build-Time Environment Variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NASA_API_KEY
ARG MONGODB_URI

# Set ENV for the build process
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NASA_API_KEY=$NASA_API_KEY
ENV MONGODB_URI=$MONGODB_URI

# 4. Build the Next.js application
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ==================================================================
# Stage 2: The "Perfected" Runner Stage
# ==================================================================
FROM node:20-slim AS runner

WORKDIR /app

# Set environment for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000

# 1. Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 nextjs

# 2. Copy the standalone output from the builder
# This is *so* much cleaner and smaller.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# 3. Copy the static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 4. Copy the public folder (which you fixed!)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# 5. Switch to the non-root user
USER nextjs

# 6. Expose the port
EXPOSE 3000

# 7. Start the application
# This now runs the standalone server
CMD ["node", "server.js"]
