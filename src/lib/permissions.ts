export type Role = 'ADMIN' | 'ELU'

export function peutValider(role: Role): boolean {
  return role === 'ADMIN'
}
export function peutProposer(role: Role): boolean {
  return role === 'ADMIN' || role === 'ELU'
}
export function peutGererComptes(role: Role): boolean {
  return role === 'ADMIN'
}
export function peutGererMesures(role: Role): boolean {
  return role === 'ADMIN'
}

// Accès au module « Moyens Généraux » : les admins, et les élus membres du groupe.
// Lit la base à chaque appel (comme lireSession relit le rôle) → révocation immédiate.
export async function peutAccederMoyensGeneraux(session: { userId: number; role: Role }): Promise<boolean> {
  if (session.role === 'ADMIN') return true
  const { prisma } = await import('@/lib/db')
  const m = await prisma.groupeMembre.findUnique({
    where: { groupe_userId: { groupe: 'MOYENS_GENERAUX', userId: session.userId } },
    select: { id: true },
  })
  return !!m
}
