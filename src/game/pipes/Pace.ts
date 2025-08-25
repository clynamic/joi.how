import { Composer, Pipe, PipeTransformer } from '../../engine';
import { Settings } from '../../settings';

const PLUGIN_NAMESPACE = 'core.pace';

export type PaceState = {
  pace: number;
};

export type PaceContext = {
  setPace: PipeTransformer<[number]>;
  resetPace: PipeTransformer<[]>;
};

export const pacePipe: Pipe = Composer.pipe(
  Composer.bind<Settings>(['context', 'settings'], settings =>
    Composer.bind<PaceState>(['state', PLUGIN_NAMESPACE], state =>
      Composer.when(
        state == null,
        Composer.set<PaceState>(['state', PLUGIN_NAMESPACE], {
          pace: settings.minPace,
        })
      )
    )
  ),

  Composer.set<PaceContext>(['context', PLUGIN_NAMESPACE], {
    setPace: (pace: number) =>
      Composer.set<number>(['state', PLUGIN_NAMESPACE, 'pace'], pace),

    resetPace: () =>
      Composer.bind<Settings>(['context', 'settings'], settings =>
        Composer.set<number>(
          ['state', PLUGIN_NAMESPACE, 'pace'],
          settings.minPace
        )
      ),
  })
);
