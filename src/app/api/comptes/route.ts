import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { hashMotDePasse } from '@/lib/auth'
import { audit } from '@/lib/audit'

async function acteur(userId: number) {
  const u = await prisma.user.findUnique({ where: { id: userId } })
  return u?.nom ?? 'Admin'
}

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { nom, email, role, motDePasse } = await req.json()
  if (!nom || !email || !motDePasse) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  const existe = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (existe) {
    return NextResponse.json({ erreur: 'Email déjà utilisé' }, { status: 409 })
  }
  const hash = await hashMotDePasse(String(motDePasse))
  const u = await prisma.user.create({
    data: {
      nom: String(nom),
      email: String(email).toLowerCase(),
      role: role === 'ADMIN' ? 'ADMIN' : 'ELU',
      motDePasseHash: hash,
    },
  })
  await audit({ auteurId: session.userId, auteurNom: await acteur(session.userId), action: 'compte.creation', cible: `Compte ${u.nom}` })
  return NextResponse.json({ ok: true, id: u.id })
}

export async function PATCH(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id, actif } = await req.json()
  const u = await prisma.user.update({ where: { id: Number(id) }, data: { actif: Boolean(actif) } })
  await audit({
    auteurId: session.userId,
    auteurNom: await acteur(session.userId),
    action: actif ? 'compte.activation' : 'compte.desactivation',
    cible: `Compte ${u.nom}`,
  })
  return NextResponse.json({ ok: true })
}

// Suppression RGPD d'un compte d'élu sortant : anonymise les identifiants
// (email/mot de passe purgés, nom remplacé) tout en conservant l'attribution
// historique sous "Ancien élu". Réservé à l'admin.
export async function DELETE(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await req.json()
  const cibleId = Number(id)
  if (cibleId === session.userId) {
    return NextResponse.json({ erreur: 'Vous ne pouvez pas supprimer votre propre compte.' }, { status: 400 })
  }
  const u = await prisma.user.findUnique({ where: { id: cibleId } })
  if (!u) return NextResponse.json({ erreur: 'Compte introuvable' }, { status: 404 })

  const ancienNom = u.nom
  // mot de passe rendu inutilisable (hash aléatoire non connu)
  const hashAleatoire = await hashMotDePasse(`anonymise-${cibleId}-${u.email}`)
  await prisma.user.update({
    where: { id: cibleId },
    data: {
      nom: 'Ancien élu',
      email: `anonymise-${cibleId}@invalide.local`,
      motDePasseHash: hashAleatoire,
      actif: false,
      anonymiseLe: new Date(),
    },
  })
  await audit({
    auteurId: session.userId,
    auteurNom: await acteur(session.userId),
    action: 'compte.anonymisation_rgpd',
    cible: `Compte ${ancienNom}`,
    details: 'Identifiants purgés, contributions conservées sous « Ancien élu ».',
  })
  return NextResponse.json({ ok: true })
}
