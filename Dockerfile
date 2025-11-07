# syntax=docker/dockerfile:1.4

#so the login issuue (Fiebase Auth ) issue was caused because we were not setting the enviorment vars in the docer file at all .
# Agrannya Singh approves of this docker file 

# ==================================================================
# Stage 1: The "Builder" Stage
# This stage builds the app. The final image won't contain
# any of its files unless we explicitly copy them.
# ==================================================================
FROM node:20-slim AS builder
WORKDIR /app

# 1. Install all dependencies
# This layer is cached as long as package.json/lock don't change
COPY package.json package-lock.json ./
RUN npm ci

# 2. Copy the rest of the source code
# This is done *after* npm ci to optimize caching
COPY . .

# 3. Set Build-Time Environment Variables
# These ARGs will be populated by Render from your dashboard
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
# Stage 2: The "Runner" Stage
# This is the final, small, secure image that will run in production.
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

# 2. Install *only* production dependencies
# Copy package files from builder and run npm ci --omit=dev
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

# 3. Copy built application files from the builder stage
# We use --chown to set the correct owner immediately
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# 4. Switch to the non-root user
USER nextjs

# 5. Expose the port
EXPOSE 3000

# 6. Start the application
# 'npm start' should be defined in your package.json to run 'next start'
CMD ["npm", "start"]
