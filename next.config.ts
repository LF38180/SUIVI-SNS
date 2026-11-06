import type { NextConfig } from 'next'

// Date de build = date de dernière mise à jour du site (chaque déploiement Railway
// relance le build). Exposée en clair (NEXT_PUBLIC_) pour un affichage discret.
const DATE_BUILD = new Date().toISOString()

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_DATE_BUILD: DATE_BUILD },
  // Note : 'output: standalone' apporterait une image plus légère mais complique
  // le boot (migrations Prisma + assets static) sur Railway. Gain marginal vs risque
  // sur un projet maintenu par 2 bénévoles → on garde le démarrage simple via boot.mjs.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
