# Sauvegarde & garde-fous anti-perte de données

Exigence du commanditaire : **un redéploiement ne doit jamais supprimer ni écraser de données.**

## Principes

1. **Code et données séparés.** La base Postgres est un service Railway distinct, à volume persistant. Redéployer l'application (nouveau code) ne touche pas la base.
2. **Migrations additives uniquement.** Le déploiement lance `prisma migrate deploy`. Aucune migration ne supprime de colonne/table sans décision manuelle explicite.
3. **Seed idempotent.** L'import initial vérifie `if (count > 0) skip`. Il ne tourne qu'une fois ; jamais au redéploiement.
4. **Historique append-only.** La table `Historique` n'est jamais mise à jour ni supprimée par le code (inaltérabilité §8.5).

## Commandes INTERDITES en production

Ne **jamais** exécuter sur la base de production :

- `prisma migrate reset`
- `prisma db push --force-reset`
- tout `DROP TABLE`, `TRUNCATE`, `DELETE FROM` manuel sur les données réelles

Ces commandes n'apparaissent dans aucun script du projet (`package.json`).

## Sauvegarde manuelle

Export complet de la base (à faire avant toute opération sensible, et au moins une fois par mois) :

```bash
pg_dump "$DATABASE_URL" > sauvegarde-$(date +%F).sql
```

Restauration (en cas de besoin, sur une base vide) :

```bash
psql "$DATABASE_URL" < sauvegarde-AAAA-MM-JJ.sql
```

## Sauvegardes automatiques

Railway propose des backups automatiques selon le plan du projet. Vérifier qu'ils sont activés sur le service Postgres. Les backups Railway ne remplacent pas l'export `pg_dump` mensuel recommandé (double sécurité).
