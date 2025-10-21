# syntax=docker/dockerfile:1.4

# Use the Node.js 20 slim image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Update npm to the latest version first
RUN npm install -g npm@latest

# Copy configuration and package files first
COPY package.json package-lock.json tsconfig.json ./

# Install ALL dependencies, temporarily setting NODE_ENV to development
# to ensure all build tools are definitely installed if there's an edge case.
# Use npm install instead of ci as a potential workaround.
ARG NODE_ENV=development
RUN npm install --no-audit --no-fund && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Now set NODE_ENV to production for the build and runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOST=0.0.0.0
ENV PORT=3000

# Build the Next.js application
RUN npm run build

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --gid 1001 nextjs

# Change ownership (Consider optimizing later if needed)
RUN chown -R nextjs:nodejs /app

# Switch to the non-root user
USER nextjs

EXPOSE 3000

# Start the application
CMD ["npm", "start"]
