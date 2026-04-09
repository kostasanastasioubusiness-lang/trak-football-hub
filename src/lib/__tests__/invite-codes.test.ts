import { describe, it, expect } from 'vitest'
import { generateCode, formatCoachCode, formatParentCode } from '../invite-codes'

describe('generateCode', () => {
  it('generates a 4-character alphanumeric string', () => {
    const code = generateCode()
    expect(code).toMatch(/^[A-Z0-9]{4}$/)
    expect(code.length).toBe(4)
  })

  it('generates unique codes on consecutive calls', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateCode()))
    expect(codes.size).toBeGreaterThan(90)
  })
})

describe('formatCoachCode', () => {
  it('formats as TRK-XXXX', () => {
    expect(formatCoachCode('AB12')).toBe('TRK-AB12')
  })
})

describe('formatParentCode', () => {
  it('formats as PAR-XXXX', () => {
    expect(formatParentCode('XY99')).toBe('PAR-XY99')
  })
})
