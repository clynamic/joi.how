import { Composer } from '../../engine/Composer';
import {
  GameContext,
  GameState,
  Pipe,
  PipeTransformer,
} from '../../engine/State';

export enum GamePhase {
  warmup = 'warmup',
  active = 'active',
  break = 'break',
  finale = 'finale',
  climax = 'climax',
}

export type PhaseState = {
  current: GamePhase;
};

export type PhaseContext = {
  setPhase: PipeTransformer<[GamePhase]>;
};

const PLUGIN_NAMESPACE = 'core.phase';

export const setPhase: PipeTransformer<[GamePhase]> = phase =>
  Composer.set<GamePhase>(['state', PLUGIN_NAMESPACE, 'current'], phase);

export const getPhase = (state: GameState): GamePhase => {
  return state[PLUGIN_NAMESPACE]?.current ?? GamePhase.warmup;
};

export const phasePipe: Pipe = Composer.chain(frame =>
  frame
    .zoom<GameState>('state', state => {
      if (!state.get(PLUGIN_NAMESPACE)) {
        state = state.set<PhaseState>(PLUGIN_NAMESPACE, {
          current: GamePhase.warmup,
        });
      }
      return state;
    })
    .zoom<GameContext>('context', context =>
      context.set<PhaseContext>(PLUGIN_NAMESPACE, {
        setPhase,
      })
    )
);
