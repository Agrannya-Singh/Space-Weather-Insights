# syntax=docker/dockerfile:1.4

# Use the Node.js 20 slim image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000

# Update npm to the latest version
RUN npm install -g npm@latest

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 nextjs

# Change ownership of the application files to the non-root user
# Note: This includes node_modules which can be slow.
# Consider optimizing if build time becomes an issue.
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

EXPOSE 3000

# Basic healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl --fail http://localhost:3000 || exit 1

# Start the application using the standard Next.js start command
CMD ["npm", "start"]
