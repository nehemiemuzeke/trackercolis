import { describe, expect, it } from 'vitest'
import { suffixeAleatoire } from '../src/services/tracking-number.service'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

describe('suffixeAleatoire', () => {
  it('génère un suffixe de la longueur demandée', () => {
    expect(suffixeAleatoire(6)).toHaveLength(6)
    expect(suffixeAleatoire(8)).toHaveLength(8)
  })

  it('n\'utilise que des caractères non ambigus', () => {
    const suffixe = suffixeAleatoire(200)
    for (const caractere of suffixe) {
      expect(ALPHABET.includes(caractere)).toBe(true)
    }
  })

  it('génère des suffixes différents sur un échantillon', () => {
    const suffixes = new Set(Array.from({ length: 100 }, () => suffixeAleatoire(8)))
    expect(suffixes.size).toBeGreaterThan(90)
  })
})
