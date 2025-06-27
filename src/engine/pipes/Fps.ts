import { Pipe } from '../State';
import { Composer } from '../Composer';

export const fpsPipe: Pipe = Composer.build(c =>
  c.bind<number>(
    ['context', 'deltaTime'],
    delta => c =>
      c.set(['context', 'core', 'fps'], delta > 0 ? 1000 / delta : 0)
  )
);
