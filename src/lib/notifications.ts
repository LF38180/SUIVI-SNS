import { prisma } from '@/lib/db'

// Notifier tous les admins actifs (ex: nouvelle proposition à valider).
export async function notifierAdmins(message: string, lien?: string) {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN', actif: true }, select: { id: true } })
  if (!admins.length) return
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, message, lien: lien ?? null })),
  })
}

// Notifier un utilisateur précis (ex: ta proposition a été validée).
export async function notifierUser(userId: number, message: string, lien?: string) {
  await prisma.notification.create({ data: { userId, message, lien: lien ?? null } })
}

// Notifier tous les élus actifs sauf un (ex: mise à jour faite par un collègue).
export async function notifierTousSauf(exclureUserId: number, message: string, lien?: string) {
  const users = await prisma.user.findMany({ where: { actif: true, id: { not: exclureUserId } }, select: { id: true } })
  if (!users.length) return
  await prisma.notification.createMany({
    data: users.map((u) => ({ userId: u.id, message, lien: lien ?? null })),
  })
}
