# ==============================================================================
# Multi-stage Dockerfile for AnatoVerse (Cloud & Container Deployments)
# ==============================================================================

# Stage 1: Build the React + Three.js application
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency specifications
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code and configuration
COPY . .

# Compile production bundle to /app/dist
RUN npm run build

# Stage 2: Serve with lightweight, high-performance Nginx
FROM nginx:alpine AS runner

# Copy customized Nginx configuration with SPA & 3D MIME support
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Port exposure (default 80 inside container)
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
