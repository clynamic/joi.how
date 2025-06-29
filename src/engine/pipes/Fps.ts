import { Pipe } from '../State';
import { Composer } from '../Composer';

export const fpsPipe: Pipe = Composer.bind<number>(
  ['context', 'deltaTime'],
  delta =>
    Composer.set(['context', 'core', 'fps'], delta > 0 ? 1000 / delta : 0)
);
