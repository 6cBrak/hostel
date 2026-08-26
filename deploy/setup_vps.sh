#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ======================================================"
echo "   Smart Hostel Atoma"
echo "   Installation automatique VPS — Docker + Traefik"
echo "  ======================================================"
echo -e "${NC}"

if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Ce script doit être exécuté en tant que root (sudo bash setup_vps.sh)${NC}"
    exit 1
fi

echo -e "${YELLOW}Configuration requise :${NC}"
echo ""
read -p "  Domaine de l'application (ex: hostel.smarthostelatoma.com) : " DOMAIN
read -p "  Repo GitHub (ex: https://github.com/<user>/smart-hostel-atoma.git) : " GITHUB_URL
echo ""
read -s -p "  Mot de passe MySQL (choisissez-en un fort) : " DB_PASSWORD
echo ""

SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/\n" | cut -c1-50)

echo ""
echo -e "${YELLOW}Récapitulatif :${NC}"
echo "  Domaine    : $DOMAIN"
echo "  GitHub     : $GITHUB_URL"
echo "  Secret Key : ${SECRET_KEY:0:12}... (auto-générée)"
echo ""
read -p "Confirmer et lancer l'installation ? (o/n) : " CONFIRM
if [[ "$CONFIRM" != "o" && "$CONFIRM" != "O" ]]; then
    echo "Installation annulée."
    exit 0
fi

# ── Docker (si pas déjà installé) ────────────────────────────────────────────
echo ""
echo -e "${BLUE}[1/6] Vérification Docker...${NC}"
if command -v docker &>/dev/null; then
    echo -e "${GREEN}  OK : Docker déjà installé${NC}"
else
    apt-get update -qq
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable docker && systemctl start docker
    echo -e "${GREEN}  OK : Docker installé${NC}"
fi

# ── Réseau web partagé ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[2/6] Réseau Docker partagé (web)...${NC}"
docker network create web 2>/dev/null \
    && echo -e "${GREEN}  OK : Réseau 'web' créé${NC}" \
    || echo -e "${GREEN}  OK : Réseau 'web' déjà existant${NC}"

# ── Traefik (si pas déjà lancé) ───────────────────────────────────────────────
echo ""
echo -e "${BLUE}[3/6] Vérification Traefik...${NC}"
if docker ps --format '{{.Names}}' | grep -q traefik; then
    echo -e "${GREEN}  OK : Traefik déjà en cours d'exécution${NC}"
else
    echo -e "${YELLOW}  Traefik non détecté — démarrez-le d'abord (ex. depuis /opt/traefik)${NC}"
fi

# ── Clonage du projet ─────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[4/6] Récupération du projet depuis GitHub...${NC}"
if [ -d "/opt/hostelatoma/.git" ]; then
    echo "  Projet déjà présent — mise à jour..."
    cd /opt/hostelatoma
    git pull origin main
else
    git clone "$GITHUB_URL" /opt/hostelatoma
    cd /opt/hostelatoma
fi
echo -e "${GREEN}  OK : Code disponible dans /opt/hostelatoma${NC}"

# ── Fichier .env ──────────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[5/6] Création du fichier .env et démarrage...${NC}"

cat > /opt/hostelatoma/.env <<EOF
SECRET_KEY=${SECRET_KEY}
DEBUG=False
ALLOWED_HOSTS=${DOMAIN}

DB_NAME=hostelatoma_db
DB_USER=root
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=db
DB_PORT=3306
DB_CONN_MAX_AGE=60

TIME_ZONE=Africa/Accra

JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

CORS_ALLOW_ALL_ORIGINS=False
CORS_ALLOWED_ORIGINS=https://${DOMAIN}
CSRF_TRUSTED_ORIGINS=https://${DOMAIN}

CACHE_BACKEND=django.core.cache.backends.locmem.LocMemCache
CACHE_LOCATION=

EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=no-reply@${DOMAIN}

MEDIA_URL=/media/
MEDIA_ROOT=media/

DOMAIN=${DOMAIN}
# BACKUP_EMAIL_TO=vous@exemple.com   # optionnel — décommentez pour recevoir les backups par email
EOF

echo -e "${GREEN}  OK : .env créé${NC}"

cd /opt/hostelatoma
docker compose up -d --build

echo ""
echo "  Attente démarrage MySQL..."
sleep 20

echo "  Application des migrations Django..."
docker compose exec django python manage.py migrate --noinput

echo "  Création du compte administrateur..."
docker compose exec django python create_superuser.py

echo ""
read -p "  Charger les données de démonstration (4 hostels / chambres — PROVISOIRE, à valider avant mise en prod réelle) ? (o/n) : " SEED
if [[ "$SEED" == "o" || "$SEED" == "O" ]]; then
    docker compose exec django python manage.py seed_hostels
    echo -e "${GREEN}  OK : données de démonstration chargées${NC}"
fi

# ── Backup automatique ────────────────────────────────────────────────────────
echo ""
echo -e "${BLUE}[6/6] Backup automatique...${NC}"
chmod +x deploy/backup.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /bin/bash /opt/hostelatoma/deploy/backup.sh") | crontab -
echo -e "${GREEN}  OK : Backup automatique configuré (3h00 chaque nuit)${NC}"

echo ""
echo -e "${GREEN}"
echo "  ======================================================"
echo "   INSTALLATION TERMINÉE AVEC SUCCÈS !"
echo "  ======================================================"
echo ""
echo "   URL de l'application : https://${DOMAIN}"
echo "   Interface admin      : https://${DOMAIN}/admin"
echo "   Login                : admin@smarthostelatoma.local"
echo "   Mot de passe         : Admin@2026!"
echo ""
echo "   IMPORTANT : Changez le mot de passe à la 1ère connexion !"
echo ""
echo "   Pour les mises à jour futures :"
echo "     bash /opt/hostelatoma/deploy/update.sh"
echo -e "  ======================================================${NC}"
