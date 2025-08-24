import { Pipe } from '../State';
import { Composer } from '../Composer';

export type FpsContext = {
  value: number;
  history: number[];
};

const PLUGIN_NAMESPACE = 'core.fps';
const HISTORY_SIZE = 30;

export const fpsPipe: Pipe = Composer.bind<number>(
  ['context', 'deltaTime'],
  delta =>
    Composer.bind<FpsContext>(['context', PLUGIN_NAMESPACE], existingFps =>
      Composer.chain(frame => {
        const currentFps = delta > 0 ? 1000 / delta : 0;
        const history = existingFps?.history ?? [];

        const newHistory = [...history, currentFps].slice(-HISTORY_SIZE);
        const newFpsData: FpsContext = {
          value: currentFps,
          history: newHistory,
        };

        return frame.zoom(['context'], context =>
          context.set<FpsContext>(PLUGIN_NAMESPACE, newFpsData)
        );
      })
    )
);
