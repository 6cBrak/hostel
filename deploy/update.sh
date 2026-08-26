#!/bin/bash
set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  =============================="
echo "   Smart Hostel Atoma — Mise à jour"
echo "  =============================="
echo -e "${NC}"

cd /opt/hostelatoma

echo -e "${BLUE}[1/3] Récupération des mises à jour GitHub...${NC}"
git pull origin main

echo -e "${BLUE}[2/3] Rebuild et redémarrage des containers...${NC}"
docker compose up -d --build

echo -e "${BLUE}[3/3] Application des nouvelles migrations...${NC}"
sleep 10
docker compose exec django python manage.py migrate --noinput

echo ""
echo -e "${GREEN}  Mise à jour terminée ! Application disponible.${NC}"
