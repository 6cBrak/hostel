#!/bin/bash
set -e

APP_DIR="/opt/hostelatoma"
BACKUP_DIR="/opt/hostelatoma/backups"
KEEP_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hostelatoma_$DATE.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"

# Email d'alerte optionnel : renseignez BACKUP_EMAIL_TO dans .env pour l'activer
# (nécessite un ~/.msmtprc valide sur le VPS avec un compte [smart_hostel]).
MAIL_TO=$(grep '^BACKUP_EMAIL_TO=' "$APP_DIR/.env" 2>/dev/null | cut -d '=' -f2)
MAIL_FROM="alerte@smarthostelatoma.local"
SMTP_HOST=$(awk '/^account[[:space:]]+smart_hostel/{f=1} f && /^host/{print $2; exit}' /root/.msmtprc 2>/dev/null || echo "")
SMTP_PORT=$(awk '/^account[[:space:]]+smart_hostel/{f=1} f && /^port/{print $2; exit}' /root/.msmtprc 2>/dev/null || echo "465")
SMTP_PASSWORD=$(awk '/^account[[:space:]]+smart_hostel/{f=1} f && /^password/{print $2; exit}' /root/.msmtprc 2>/dev/null || echo "")

DB_PASSWORD=$(grep '^DB_PASSWORD=' "$APP_DIR/.env" | cut -d '=' -f2)
DB_NAME=$(grep '^DB_NAME=' "$APP_DIR/.env" | cut -d '=' -f2)

send_mail() {
    local subject="$1"
    local body="$2"
    local attachment="${3:-}"
    if [ -n "$MAIL_TO" ] && [ -n "$SMTP_PASSWORD" ]; then
        python3 "$APP_DIR/deploy/send_mail.py" \
            "$SMTP_HOST" "$SMTP_PORT" "$MAIL_FROM" "$SMTP_PASSWORD" \
            "$MAIL_TO" "$subject" "$body" "$attachment" 2>>"$LOG_FILE" || true
    fi
}

if [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    MSG="[$(date)] ERREUR : impossible de lire DB_PASSWORD ou DB_NAME depuis .env"
    echo "$MSG" >> "$LOG_FILE"
    send_mail "[Smart Hostel Atoma] Backup ECHOUE - $(date +%d/%m/%Y)" "$MSG"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

cd "$APP_DIR"

if docker compose exec -T db mysqldump \
    -u root \
    -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    "$DB_NAME" | gzip > "$BACKUP_FILE"; then

    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "[$(date)] OK  : $BACKUP_FILE ($SIZE)" >> "$LOG_FILE"

    BODY="Backup quotidien effectue avec succes.

Fichier : $(basename "$BACKUP_FILE")
Taille  : $SIZE
Date    : $(date)

Ce message est envoye automatiquement par Smart Hostel Atoma."

    send_mail "[Smart Hostel Atoma] Backup reussi - $(date +%d/%m/%Y)" "$BODY" "$BACKUP_FILE"

else
    echo "[$(date)] ERREUR : mysqldump a echoue" >> "$LOG_FILE"
    rm -f "$BACKUP_FILE"

    BODY="Le backup quotidien a echoue.

Date : $(date)

Verifiez le log sur le serveur : $LOG_FILE
Ce message est envoye automatiquement par Smart Hostel Atoma."

    send_mail "[Smart Hostel Atoma] ERREUR Backup - $(date +%d/%m/%Y)" "$BODY"
    exit 1
fi

DELETED=$(find "$BACKUP_DIR" -name "hostelatoma_*.sql.gz" -mtime +$KEEP_DAYS -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Nettoyage : $DELETED fichier(s) supprime(s) (> $KEEP_DAYS jours)" >> "$LOG_FILE"
fi
