#!/usr/bin/env bash
# Sauvegarde chiffrée de la base Postgres vers Backblaze B2 (compatible S3).
# Lancé par GitHub Actions (cron quotidien) — voir .github/workflows/backup.yml.
#
# Variables d'environnement attendues (secrets GitHub) :
#   DATABASE_URL        : connexion Postgres (DATABASE_PUBLIC_URL de Railway)
#   BACKUP_PASSPHRASE   : phrase secrète pour chiffrer le dump (à garder précieusement !)
#   B2_KEY_ID           : keyID Backblaze
#   B2_APP_KEY          : applicationKey Backblaze
#   B2_BUCKET           : nom du bucket (ex: sns-sauvegardes)
#   B2_ENDPOINT         : endpoint S3 (ex: s3.us-west-004.backblazeb2.com)

set -euo pipefail

HORODATAGE=$(date -u +%Y-%m-%d_%H%M)
FICHIER="sns-backup-${HORODATAGE}.sql.gz.gpg"

echo "[backup] Dump de la base…"
pg_dump "$DATABASE_URL" \
  | gzip -9 \
  | gpg --batch --yes --symmetric --cipher-algo AES256 --passphrase "$BACKUP_PASSPHRASE" \
  > "$FICHIER"

TAILLE=$(du -h "$FICHIER" | cut -f1)
echo "[backup] Fichier chiffré créé : $FICHIER ($TAILLE)"

echo "[backup] Envoi vers Backblaze B2…"
AWS_ACCESS_KEY_ID="$B2_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$B2_APP_KEY" \
aws s3 cp "$FICHIER" "s3://${B2_BUCKET}/${FICHIER}" \
  --endpoint-url "https://${B2_ENDPOINT}"

echo "[backup] Sauvegarde terminée : ${FICHIER}"

# Rétention : on liste et on garde ~30 sauvegardes (le reste est supprimé).
echo "[backup] Nettoyage des anciennes sauvegardes (rétention 30)…"
AWS_ACCESS_KEY_ID="$B2_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$B2_APP_KEY" \
aws s3 ls "s3://${B2_BUCKET}/" --endpoint-url "https://${B2_ENDPOINT}" \
  | awk '{print $4}' | grep '^sns-backup-' | sort | head -n -30 \
  | while read -r vieux; do
      [ -n "$vieux" ] && AWS_ACCESS_KEY_ID="$B2_KEY_ID" AWS_SECRET_ACCESS_KEY="$B2_APP_KEY" \
        aws s3 rm "s3://${B2_BUCKET}/${vieux}" --endpoint-url "https://${B2_ENDPOINT}"
    done

echo "[backup] OK."
