import { NumberRange } from './range';

/**
 * hyperbolic tangent function
 * f(i) = tanh(s * (i - i_max / 2) - i_min / 2) + 1
 *
 * Special thanks to @Fauxil for making this intensity mapper function!
 * https://www.desmos.com/calculator/gvwk2rmuix
 */
export const intensityToPace = (
  intensity: number,
  steepness: number,
  { min, max }: NumberRange
): number => {
  const minIntensity = 0;
  const maxIntensity = 100;

  const bottom = minIntensity * 0.5;
  const mid = intensity - maxIntensity * 0.5;

  const curve = Math.tanh(steepness * mid - bottom);

  return (curve + 1) * 0.5 * (max - min) + min;
};

export const intensityToPaceRange = (
  intensity: number,
  steepness: number,
  { min, max }: NumberRange
): NumberRange => {
  const pace = intensityToPace(intensity, steepness, { min, max });
  return {
    min: Math.max(min, pace - 1.5),
    max: Math.min(max, pace + 1.5),
  };
};
