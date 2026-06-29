'use client'

export function BoutonImpression() {
  return (
    <button onClick={() => window.print()} className="btn primary no-print">
      Imprimer / PDF
    </button>
  )
}
