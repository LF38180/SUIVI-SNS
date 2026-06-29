import { prisma } from '@/lib/db'

// Enregistre une action admin sensible dans le journal d'audit.
// auteurNom est dénormalisé pour rester lisible même si le compte est anonymisé.
export async function audit(params: {
  auteurId: number
  auteurNom: string
  action: string
  cible?: string
  details?: string
}) {
  await prisma.auditLog.create({
    data: {
      auteurId: params.auteurId,
      auteurNom: params.auteurNom,
      action: params.action,
      cible: params.cible ?? null,
      details: params.details ?? null,
    },
  })
}
