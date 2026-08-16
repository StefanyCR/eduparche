# ─── Etapa 1: Build ──────────────────────────────────────────────────────────
# Compilamos TypeScript a JavaScript
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos solo package.json primero (aprovecha cache de Docker)
# npm install (no "ci")
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y compilamos
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Etapa 2: Runtime ────────────────────────────────────────────────────────
# Imagen final, solo con lo necesario para correr (sin herramientas de dev)
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Solo instalamos dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev

# Copiamos el build y los archivos que Prisma necesita en runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

# Aplica migraciones pendientes y luego inicia el servidor
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
