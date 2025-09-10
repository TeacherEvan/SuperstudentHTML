# Stage 1: Build the application
FROM node:16-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve via nginx
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration to support SPA routing
COPY docker/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
