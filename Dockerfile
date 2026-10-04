FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
FROM node:24-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
ENV HOST=0.0.0.0 PORT=3030 DATA_DIR=/app/data
VOLUME ["/app/data"]
EXPOSE 3030
CMD ["node", "server/start.mjs"]
