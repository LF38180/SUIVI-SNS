// Mention discrète « site mis à jour le … » en pied de page. La date vient du build
// (NEXT_PUBLIC_DATE_BUILD, injectée par next.config à chaque déploiement Railway).
export function PiedVersion() {
  const iso = process.env.NEXT_PUBLIC_DATE_BUILD
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const fmt = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
  }).format(d)
  return (
    <div style={{ textAlign: 'center', fontSize: 11, color: '#B9B9BE', padding: '18px 0 24px' }}>
      Site mis à jour le {fmt}
    </div>
  )
}
