#!/bin/sh
set -e

echo "⏳ Attente de PostgreSQL..."
until nc -z db 5432; do
  echo "PostgreSQL pas encore prêt, on attend 2s..."
  sleep 2
done

echo "✅ PostgreSQL prêt."
echo "🔄 Application du schéma Prisma..."
node_modules/.bin/prisma db push --schema=prisma/schema.prisma --url="$DATABASE_URL" --accept-data-loss

echo "🚀 Démarrage de l'application..."
exec node server.js
