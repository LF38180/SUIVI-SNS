#!/usr/bin/env bash
# Restauration d'une sauvegarde chiffrée vers une base Postgres.
# ⚠️ À utiliser sur une base VIDE / de test, JAMAIS sur la prod sans certitude.
#
# Usage :
#   B2_KEY_ID=... B2_APP_KEY=... B2_BUCKET=... B2_ENDPOINT=... \
#   BACKUP_PASSPHRASE=... CIBLE_DATABASE_URL=postgresql://... \
#   bash scripts/restore.sh sns-backup-2026-07-01_0300.sql.gz.gpg

set -euo pipefail
FICHIER="${1:?Donner le nom du fichier de sauvegarde à restaurer}"

echo "[restore] Téléchargement de $FICHIER depuis B2…"
AWS_ACCESS_KEY_ID="$B2_KEY_ID" \
AWS_SECRET_ACCESS_KEY="$B2_APP_KEY" \
aws s3 cp "s3://${B2_BUCKET}/${FICHIER}" "./${FICHIER}" \
  --endpoint-url "https://${B2_ENDPOINT}"

echo "[restore] Déchiffrement + décompression + restauration…"
gpg --batch --yes --decrypt --passphrase "$BACKUP_PASSPHRASE" "$FICHIER" \
  | gunzip \
  | psql "$CIBLE_DATABASE_URL"

echo "[restore] Restauration terminée dans la base cible."
