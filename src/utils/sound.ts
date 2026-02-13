import Generator from 'wasgen';

let gen: Generator | null = null;

function getGen(): Generator {
  if (!gen) gen = new Generator();
  return gen;
}

export function playTone(frequency: number): number {
  const g = getGen();
  return g.play(
    [{ type: 'sine', gain: { a: 0.0237, h: 0, d: 0.0114, s: 1, r: 0.011 } }],
    frequency,
    0.25,
    g.now(),
    (g.now() as number) + 0.0237 + 0.0114 + 0.011
  );
}
