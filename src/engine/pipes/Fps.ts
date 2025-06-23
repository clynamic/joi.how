import { Pipe } from '../State';
import { Composer } from '../Composer';

export const fpsPipe: Pipe = Composer.buildFocus('context', ctx =>
  ctx.setIn('core', {
    fps: ctx.get().deltaTime > 0 ? 1000 / ctx.get().deltaTime : 0,
  })
);
