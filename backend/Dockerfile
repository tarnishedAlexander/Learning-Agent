

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Etapa de producción
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 3000
CMD echo "==> Ejecutando migraciones..." && npx prisma migrate deploy && \
	echo "==> Ejecutando seeds..." && npx prisma db seed && \
	echo "==> Iniciando aplicación..." && node dist/src/main.js
