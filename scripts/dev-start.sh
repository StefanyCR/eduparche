#!/bin/bash
# Script de arranque para desarrollo local
# Levanta Docker y espera que la DB esté lista antes de iniciar las apps

set -e

echo ""
echo "==> Levantando infraestructura (Docker)..."
docker compose up -d

echo ""
echo "==> Esperando que PostgreSQL esté listo..."
RETRIES=30
until docker compose exec -T db pg_isready -U eduparche_user > /dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  echo "    Esperando base de datos... ($RETRIES intentos restantes)"
  RETRIES=$((RETRIES - 1))
  sleep 2
done

if [ $RETRIES -eq 0 ]; then
  echo ""
  echo "ERROR: PostgreSQL no respondió a tiempo. Revisa los logs con: npm run docker:logs"
  exit 1
fi

echo "    PostgreSQL listo."
echo ""
echo "==> Iniciando backend (puerto 3001) y frontend (puerto 3000)..."
echo ""
