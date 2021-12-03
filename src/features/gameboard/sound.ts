import * as fx from 'wafxr'

export function playTone(frequency: number) {
  return fx.play({ volume: 0.25, sustain: 0.0237, release: 0.0114, frequency, source: 'sine', harmonics: 1 })
}
