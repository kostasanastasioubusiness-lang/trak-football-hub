import { expect, it } from 'vitest'

// Throwaway (TRAK-469): proves the gathering `test` job goes red, not skipped, when one part fails. Never merge.
it('fails on purpose', () => { expect(1).toBe(2) })
