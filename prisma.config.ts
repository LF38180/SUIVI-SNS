import { defineConfig } from 'prisma/config'

// Pas de `import 'dotenv/config'` ici : en production (Railway) les variables
// d'environnement sont déjà injectées, et dotenv n'est pas installé en mode
// --omit=dev. En local, Next et tsx chargent .env eux-mêmes.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
