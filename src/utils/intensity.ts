import { NumberRange } from './range';
import { polynomialRoot } from 'mathjs';

/**
 * Convert intensity to pace.
 * Thanks Oreo <3
 * https://www.desmos.com/calculator/y4fcreol4p
 */
export const intensityToPace = (
  intensity: number,
  steepness: number,
  timeshift: number,
  { min, max }: NumberRange
): number => {
  const x2 = 100 * Math.min(steepness * 2 * timeshift, 1);
  const x3 = 100 * Math.max(1 - 2 * steepness * (1 - timeshift), 0);
  const x4 = 100;

  const a = 3 * x2 - 3 * x3 + x4;
  const b = -6 * x2 + 3 * x3;
  const c = 3 * x2;

  const roots = polynomialRoot(-intensity, c, b, a);
  const t = roots.find(
    (root): root is number => typeof root === 'number' && root >= 0 && root <= 1
  )!;

  return (-2 * t * t * t + 3 * t * t) * (max - min) + min;
};

export const intensityToPaceRange = (
  intensity: number,
  steepness: number,
  timeshift: number,
  { min, max }: NumberRange
): NumberRange => {
  const pace = intensityToPace(intensity, steepness, timeshift, { min, max });
  return {
    min: Math.max(min, pace - 1.5),
    max: Math.min(max, pace + 1.5),
  };
};

/**
 * The [intensityToPace] function needs to reverse from a coordinate to a time.
 * For that reason, it is costly. We use this function for the graph instead.
 */
export const paceGraphPoint = (
  t: number,
  steepness: number,
  timeshift: number,
  { min, max }: NumberRange
): readonly [number, number] => {
  const x2 = 100 * Math.min(steepness * 2 * timeshift, 1);
  const x3 = 100 * Math.max(1 - 2 * steepness * (1 - timeshift), 0);
  const x4 = 100;

  const x =
    (3 * x2 - 3 * x3 + x4) * t * t * t +
    (-6 * x2 + 3 * x3) * t * t +
    3 * x2 * t;

  const y = -2 * t * t * t + 3 * t * t;

  return [x, y * (max - min) + min] as const;
};
