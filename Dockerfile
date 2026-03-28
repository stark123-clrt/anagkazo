FROM node:20-alpine AS base

# ─── ÉTAPE 1 : Dépendances ───────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# ─── ÉTAPE 2 : Build ─────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── ÉTAPE 3 : Image de production (légère) ──────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache netcat-openbsd

# Fichiers Next.js standalone
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma : schema + client généré + CLI complet (avec toutes ses dépendances)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Script de démarrage
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
