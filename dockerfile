# Dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for DATABASE_URL (needed for prisma generate)
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

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built app from builder (adjust path based on your actual build output)
COPY --from=builder /app/dist/src ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application (adjust path based on your actual build structure)
CMD ["node", "dist/main.js"]