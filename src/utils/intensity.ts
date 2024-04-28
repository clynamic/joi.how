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

  const minPace = 0.25;
  const maxPace = 10;

  const bottom = minIntensity * 0.5;
  const mid = intensity - maxIntensity * 0.5;

  const curve = Math.tanh(steepness * mid - bottom);

  return (curve + 1) * 0.5 * (maxPace - minPace) + minPace;
};
