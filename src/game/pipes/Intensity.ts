import { Composer, GameContext, Pipe } from '../../engine';

const PLUGIN_NAMESPACE = 'core.intensity';

export type IntensityState = {
  intensity: number;
};

export const intensityPipe: Pipe = Composer.bind<number>(
  ['context', 'deltaTime'],
  delta =>
    Composer.bind<GameContext>(['context'], ({ settings }) =>
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
);
