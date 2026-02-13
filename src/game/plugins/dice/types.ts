import { Pipe, GameFrame } from '../../../engine/State';
import { Composer } from '../../../engine/Composer';
import { pluginPaths } from '../../../engine/plugins/Plugins';
import { typedPath } from '../../../engine/Lens';
import { IntensityState } from '../intensity';
import { PaceState } from '../pace';
import { Settings } from '../../../settings';
import { GameEvent as GameEventType } from '../../../types';

export const PLUGIN_ID = 'core.dice';

export type DiceState = {
  busy: boolean;
};

export const dice = pluginPaths<DiceState>(PLUGIN_ID);
export const paceState = typedPath<PaceState>(['state', 'core.pace']);
export const intensityState = typedPath<IntensityState>([
  'state',
  'core.intensity',
]);
export const settings = typedPath<Settings>(['context', 'settings']);

export const setBusy = (val: boolean): Pipe =>
  Composer.set(dice.state.busy, val);

export type DiceOutcome = {
  id: GameEventType;
  check?: (frame: GameFrame) => boolean;
  activate?: Pipe;
  update: Pipe;
};
