# Stage 1: Build the Vite production bundle
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: High-performance Nginx web server for Cloud Run / GKE
FROM nginx:alpine AS runner

# Cloud Run injects $PORT (defaults to 8080).
# Nginx's envsubst template automatically replaces ${PORT} on startup.
ENV PORT=8080

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
