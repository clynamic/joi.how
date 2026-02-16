import { Pipe, GameFrame } from '../../../engine/State';
import { Events } from '../../../engine/pipes/Events';
import { pluginPaths } from '../../../engine/plugins/Plugins';
import { typedPath } from '../../../engine/Lens';
import { IntensityState } from '../intensity';
import { PaceState } from '../pace';
import { Settings } from '../../../settings';
import { DiceEvent } from '../../../types';

export const PLUGIN_ID = 'core.dice';

export type DiceLogEntry = { time: number; event: DiceEvent };

export type DiceState = {
  busy: boolean;
  log: DiceLogEntry[];
};

export const dice = pluginPaths<DiceState>(PLUGIN_ID);
export const paceState = typedPath<PaceState>(['state', 'core.pace']);
export const intensityState = typedPath<IntensityState>([
  'state',
  'core.intensity',
]);
export const settings = typedPath<Settings>(['context', 'settings']);

export const OUTCOME_DONE = Events.getKey(PLUGIN_ID, 'outcome.done');
export const outcomeDone = (): Pipe => Events.dispatch({ type: OUTCOME_DONE });

export type DiceOutcome = {
  id: DiceEvent;
  check?: (frame: GameFrame) => boolean;
  activate?: Pipe;
  update: Pipe;
};
