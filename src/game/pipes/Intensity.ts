import { Composer, Pipe } from '../../engine';
import { Settings } from '../../settings';
import { GamePhase } from './Phase';

const PLUGIN_NAMESPACE = 'core.intensity';

export type IntensityState = {
  intensity: number;
};

export const intensityPipe: Pipe = Composer.bind<GamePhase>(
  ['state', 'core.phase', 'current'],
  currentPhase =>
    Composer.when(
      currentPhase === GamePhase.active,
      Composer.bind<number>(['context', 'deltaTime'], delta =>
        Composer.bind<Settings>(['context', 'settings'], settings =>
          Composer.over<IntensityState>(
            ['state', PLUGIN_NAMESPACE],
            ({ intensity = 0 }) => ({
              intensity: Math.min(
                1,
                intensity + delta / (settings.gameDuration * 1000)
              ),
            })
          )
        )
      )
    )
);
