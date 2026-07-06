import Link from 'next/link'

// Bandeau « MODE DÉMONSTRATION » affiché en haut de toutes les pages /demo/*.
export function BandeauDemo() {
  return (
    <div style={{ background: '#232326', color: '#fff', padding: '10px 22px', fontSize: 13, textAlign: 'center', position: 'sticky', top: 0, zIndex: 60 }}>
      🎬 <b>MODE DÉMONSTRATION</b> — données fictives (avancements, journaux, situations). La vraie base n’est pas modifiée.{' '}
      <Link href="/admin" style={{ color: '#EE9B7E', textDecoration: 'underline' }}>Quitter la démo</Link>
    </div>
  )
}
