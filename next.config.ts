import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
