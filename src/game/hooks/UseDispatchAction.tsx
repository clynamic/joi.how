import { createActionContext, GameAction } from '../../engine/pipes/Action';
import { useGameEngine } from '../GameProvider';

export function useDispatchAction() {
  const { injectContext } = useGameEngine();

  return {
    dispatchAction: (action: GameAction) => {
      injectContext(createActionContext(action));
    },
  };
}
