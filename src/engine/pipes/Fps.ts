import { PipeValue } from '../State';
import { namespaced } from '../Namespace';

export const fpsPipe = ({ state, context }: PipeValue): PipeValue => {
  const { deltaTime } = context;

  const fps = deltaTime > 0 ? 1000 / deltaTime : 0;

  return {
    state,
    context: namespaced('core', {
      fps,
    })(context),
  };
};
