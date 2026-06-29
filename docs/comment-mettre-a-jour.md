# Comment mettre à jour l'application (guide simple)

> Une fois le projet en place (c'est fait), modifier et déployer = très simple.

## Le workflow normal : 1 seule action

Quand le code est modifié (par toi ou par Claude) :

```bash
git add -A
git commit -m "description du changement"
git push
```

**C'est tout.** Railway détecte le push sur `main` et redéploie automatiquement (~2 min).
Aucune manipulation dans l'interface Railway nécessaire.

## Vérifier que le déploiement a marché

1. Attendre ~2 min après le push.
2. Ouvrir : `https://TON-DOMAINE.up.railway.app/api/health`
   - Réponse attendue : `{"app":"ok","db":"ok","nbMesures":67}`
   - Si `db:"ok"` → tout va bien.
3. Ou ouvrir directement l'app : elle doit afficher la page de connexion.

## Connexion

- Admins : Loïck Ferrucci, Julie De Breza
- Email : `prenom.nom@mairie-seyssins.fr`
- Mot de passe initial : valeur de `SEED_PASSWORD` (à changer — fonctionnalité à ajouter).

## Si quelque chose casse après un déploiement

1. Railway → service SUIVI-SNS → **Deployments** → cliquer le dernier déploiement → **Deploy Logs**.
2. Chercher les lignes `[boot] ...` : elles disent si la base est connectée.
3. Bouton **Rollback** sur un déploiement précédent qui marchait = retour arrière immédiat (les données ne sont pas touchées).

## Ce qui ne change JAMAIS au déploiement

- Les données (avancements, propositions, journaux, historique) : base séparée, persistante.
- Un redéploiement ne supprime ni n'écrase jamais rien (migrations additives + seed idempotent).

## Réglages Railway (déjà configurés, pour mémoire)

- **Build Command** : `npm run build`
- **Start Command** : `npm run start:prod`
- **Variables** : `DATABASE_URL`, `SESSION_SECRET`, `SEED_PASSWORD`
- Base Postgres = service séparé dans le même projet Railway.
