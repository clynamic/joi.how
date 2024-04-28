import { NumberRange } from './range';

export const settingsMinPace = 0.25;
export const settingsMaxPace = 10;

/**
 * hyperbolic tangent function
 * f(i) = tanh(s * (i - i_max / 2) - i_min / 2) + 1
 *
 * Special thanks to @Fauxil for making this intensity mapper function!
 * https://www.desmos.com/calculator/gvwk2rmuix
 */
export const intensityToPace = (
  intensity: number,
  steepness: number
): number => {
  const minIntensity = 0;
  const maxIntensity = 100;

  const bottom = minIntensity * 0.5;
  const mid = intensity - maxIntensity * 0.5;

  const curve = Math.tanh(steepness * mid - bottom);

  return (
    (curve + 1) * 0.5 * (settingsMaxPace - settingsMinPace) + settingsMinPace
  );
};

export const intensityToPaceRange = (
  intensity: number,
  steepness: number
): NumberRange => {
  const pace = intensityToPace(intensity, steepness);
  return {
    min: Math.max(settingsMinPace, pace - 1.5),
    max: Math.min(settingsMaxPace, pace + 1.5),
  };
};
