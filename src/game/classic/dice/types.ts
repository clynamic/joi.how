import { Pipe } from '../../../engine/State';
import { Events } from '../../../engine/pipes/Events';
import { pluginPaths } from '../../../engine/plugins/Plugins';
import { typedPath } from '../../../engine/Lens';
import { IntensityState } from '../intensity';
import { PaceState } from '../pace';
import { DiceEvent } from './events';

export function round(number: number): number {
  return Math.round(number * 100) / 100;
}

export const PLUGIN_ID = 'how.joi.classic.dice';

export type DiceLogEntry = { time: number; event: DiceEvent };

export type DiceState = {
  busy: boolean;
  log: DiceLogEntry[];
};

export const dice = pluginPaths<DiceState>(PLUGIN_ID);
export const paceState = typedPath<PaceState>(['how.joi.classic.pace']);
export const intensityState = typedPath<IntensityState>([
  'how.joi.classic.intensity',
]);

export const OUTCOME_DONE = Events.getKey(PLUGIN_ID, 'outcome.done');
export const outcomeDone = (): Pipe => Events.dispatch({ type: OUTCOME_DONE });
