import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe } from '@/lib/statut'

function champ(v: unknown): string {
  let s = String(v ?? '')
  // Anti-injection de formule Excel/Sheets : préfixer une apostrophe si la
  // valeur commence par un caractère de formule (= + - @, tab, retour chariot).
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })

  const mesures = await prisma.mesure.findMany({
    where: { deletedAt: null, statutMesure: 'VALIDEE' },
    orderBy: { ordre: 'asc' },
    include: { responsables: { include: { user: { select: { nom: true } } }, orderBy: { role: 'asc' } } },
  })
  const entete = ['Axe', 'Rubrique', 'Intitulé', 'Responsables', 'Élus concernés', 'Coût', 'Ordre de grandeur', 'Avancement', 'Statut']
  const lignes = mesures.map((m) =>
    [
      NOMS_AXES[m.categorie],
      m.rubrique,
      m.intitule,
      m.responsables.filter((r) => r.role === 'RESPONSABLE').map((r) => r.user.nom).join(' / '),
      m.responsables.filter((r) => r.role === 'CONCERNE').map((r) => r.user.nom).join(' / '),
      m.natureCout ?? '',
      m.ordreGrandeur ?? '',
      `${m.avancementPublie}%`,
      statutDe(m.avancementPublie).nom,
    ]
      .map(champ)
      .join(','),
  )
  // BOM UTF-8 pour qu'Excel affiche correctement les accents
  const csv = '﻿' + [entete.map(champ).join(','), ...lignes].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="suivi-sns.csv"',
    },
  })
}
