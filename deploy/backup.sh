#!/bin/bash
#
# Backup quotidien de Smart Hostel Atoma (MySQL dans Docker) + envoi par email.
#
# Posé en cron par deploy/setup_vps.sh :  5 4 * * * /bin/bash /opt/hostelatoma/deploy/backup.sh
#
# Email optionnel : renseignez BACKUP_EMAIL_TO dans /opt/hostelatoma/.env
# (nécessite /root/.msmtprc avec un compte [smart_hostel] : host / port / password).
#
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
APP_DIR="/opt/hostelatoma"
BACKUP_DIR="$APP_DIR/backups"
KEEP_DAYS=30
MAX_ATTACH_MB=20          # au-delà, l'email part sans la pièce jointe (limite ~25 Mo Gmail)
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hostelatoma_$DATE.sql.gz"
LOG_FILE="$BACKUP_DIR/backup.log"
LOCK_FILE="$BACKUP_DIR/.backup.lock"

mkdir -p "$BACKUP_DIR"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"; }

# ── Verrou : évite deux exécutions simultanées ───────────────────────────────
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    log "SKIP : un backup est déjà en cours, abandon."
    exit 0
fi

# ── Lecture des identifiants (.env, sans casser les valeurs contenant un '=') ─
read_env() {
    # '|| true' : une clé absente/commentée ne doit pas faire échouer le script (pipefail)
    { grep -m1 "^$1=" "$APP_DIR/.env" 2>/dev/null || true; } | cut -d= -f2- | tr -d '\r' | sed -e 's/^"//' -e 's/"$//'
}
DB_PASSWORD=$(read_env DB_PASSWORD)
DB_NAME=$(read_env DB_NAME)
DB_USER=$(read_env DB_USER); DB_USER=${DB_USER:-root}

MAIL_TO=$(read_env BACKUP_EMAIL_TO)
MAIL_FROM="alerte@smarthostelatoma.local"
msmtp_val() { awk -v k="$1" '/^account[[:space:]]+smart_hostel/{f=1} f && $1==k {print $2; exit}' /root/.msmtprc 2>/dev/null || true; }
SMTP_HOST=$(msmtp_val host)
SMTP_PORT=$(msmtp_val port); SMTP_PORT=${SMTP_PORT:-465}
SMTP_PASSWORD=$(msmtp_val password)

send_mail() {
    local subject="$1" body="$2" attachment="${3:-}"
    [ -n "$MAIL_TO" ] && [ -n "$SMTP_PASSWORD" ] || return 0
    if python3 "$APP_DIR/deploy/send_mail.py" \
        "$SMTP_HOST" "$SMTP_PORT" "$MAIL_FROM" "$SMTP_PASSWORD" \
        "$MAIL_TO" "$subject" "$body" "$attachment" 2>>"$LOG_FILE"; then
        log "Mail : envoyé à $MAIL_TO"
    else
        log "Mail : ÉCHEC envoi à $MAIL_TO"
    fi
}

fail() {
    local msg="$1"
    log "ERREUR : $msg"
    rm -f "$BACKUP_FILE"
    send_mail "[Smart Hostel Atoma] ERREUR Backup - $(date +%d/%m/%Y)" \
"Le backup quotidien a échoué.

Erreur : $msg
Date   : $(date)

Consultez le log sur le serveur : $LOG_FILE
Message automatique de Smart Hostel Atoma."
    exit 1
}

# ── Vérifs préalables ────────────────────────────────────────────────────────
[ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ] || fail "impossible de lire DB_PASSWORD ou DB_NAME depuis .env"

cd "$APP_DIR"

# ── Dump MySQL + compression (pipefail actif : une erreur du dump fait échouer) ─
docker compose exec -T db mysqldump \
    -u "$DB_USER" -p"$DB_PASSWORD" \
    --single-transaction --quick --routines --triggers \
    --no-tablespaces --set-gtid-purged=OFF \
    "$DB_NAME" | gzip > "$BACKUP_FILE" || fail "mysqldump a échoué"

# ── Contrôle d'intégrité de l'archive ────────────────────────────────────────
gzip -t "$BACKUP_FILE" 2>>"$LOG_FILE" || fail "archive gzip corrompue"
FIRST_BYTE=$(gzip -dc "$BACKUP_FILE" 2>/dev/null | head -c 1 || true)
[ -n "$FIRST_BYTE" ] || fail "dump vide"

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
SIZE_MB=$(( $(stat -c%s "$BACKUP_FILE") / 1024 / 1024 ))
log "OK  : $BACKUP_FILE ($SIZE)"

# ── Email de confirmation (pièce jointe seulement si raisonnable) ─────────────
ATTACH="$BACKUP_FILE"
NOTE=""
if [ "$SIZE_MB" -ge "$MAX_ATTACH_MB" ]; then
    ATTACH=""
    NOTE="
NB : fichier trop volumineux ($SIZE) pour être joint — récupérez-le sur le serveur
     dans $BACKUP_DIR"
fi

send_mail "[Smart Hostel Atoma] Backup réussi - $(date +%d/%m/%Y)" \
"Backup quotidien effectué avec succès.

Base   : $DB_NAME
Fichier : $(basename "$BACKUP_FILE")
Taille : $SIZE
Date   : $(date)$NOTE

Message automatique de Smart Hostel Atoma." \
"$ATTACH"

# ── Rotation des anciens backups ────────────────────────────────────────────
DELETED=$(find "$BACKUP_DIR" -name 'hostelatoma_*.sql.gz' -mtime +"$KEEP_DAYS" -print -delete | wc -l)
[ "$DELETED" -gt 0 ] && log "Nettoyage : $DELETED fichier(s) supprimé(s) (> $KEEP_DAYS jours)"

exit 0
