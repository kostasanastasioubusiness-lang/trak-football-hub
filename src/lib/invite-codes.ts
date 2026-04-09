export function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const array = new Uint8Array(4)
  crypto.getRandomValues(array)
  for (const byte of array) {
    code += chars[byte % chars.length]
  }
  return code
}

export function formatCoachCode(code: string): string {
  return `TRK-${code.toUpperCase()}`
}

export function formatParentCode(code: string): string {
  return `PAR-${code.toUpperCase()}`
}

export function parseInviteCode(input: string): { prefix: string; code: string } | null {
  const match = input.trim().toUpperCase().match(/^(TRK|PAR)-([A-Z0-9]{4})$/)
  if (!match) return null
  return { prefix: match[1], code: match[2] }
}
