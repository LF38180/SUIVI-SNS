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
