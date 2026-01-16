# Dockerfile

# Builder stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for DATABASE_URL (needed for Prisma client if used in build)
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Build application
RUN npm run build
RUN ls -R /app/dist

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built app and Prisma schema from builder
COPY --from=builder /app/dist/src ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/main.js"]

