import Generator from 'wasgen'

const gen = new Generator()

export function playTone(frequency: number) {
  return gen.play(
    [{ type: 'sine', gain: { a: 0.0237, h: 0, d: 0.0114, s: 1, r: 0.011 } }],
    frequency,
    0.25,
    gen.now(),
    gen.now() + 0.0237 + 0.0114 + 0.011,
  )
}
