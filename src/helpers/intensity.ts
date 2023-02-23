import { type IState } from '../store'

/**
 * Special thanks to @Fauxil for making this intensity mapper function!
 * https://www.desmos.com/calculator/gvwk2rmuix
 */
export function intensityToPaceBounds(
  intensity: number,
  steepness: number,
  paceBounds: IState['settings']['pace'],
): IState['settings']['pace'] {
  const maxIntensity = 100
  const minIntensity = 0
  const offset = minIntensity / 2
  const mid = Math.max(
    paceBounds.min,
    Math.min(
      paceBounds.max,
      paceBounds.min + 0.5 * (paceBounds.max - paceBounds.min) * (Math.tanh(steepness * (intensity - maxIntensity / 2) - offset) + 1),
    ),
  )

  return {
    max: Math.min(mid + 1.5, paceBounds.max),
    min: Math.max(mid - 1.5, paceBounds.min),
  }
}
