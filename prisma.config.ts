import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Lecture directe (pas env() qui lève si absent) : `prisma generate` n'a pas
    // besoin de l'URL réelle. `migrate deploy` et le runtime, eux, l'auront via
    // les variables d'environnement Railway.
    url: process.env.DATABASE_URL ?? '',
  },
})
