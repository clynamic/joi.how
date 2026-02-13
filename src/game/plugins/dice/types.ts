import { Pipe } from '../../../engine/State';
import { Composer } from '../../../engine/Composer';
import { pluginPaths } from '../../../engine/plugins/Plugins';
import { typedPath } from '../../../engine/Lens';
import { GameContext } from '../../../engine';
import { IntensityState } from '../intensity';
import { PaceState } from '../pace';
import { Settings } from '../../../settings';
import { PhaseState } from '../phase';
import { GameEvent as GameEventType } from '../../../types';

export const PLUGIN_ID = 'core.dice';

export enum Paws {
  left = 'left',
  right = 'right',
  both = 'both',
}

export const PawLabels: Record<Paws, string> = {
  left: 'Left',
  right: 'Right',
  both: 'Both',
};

export type DiceState = {
  edged: boolean;
  paws: Paws;
  busy: boolean;
  rollTimer: number;
};

export const dice = pluginPaths<DiceState>(PLUGIN_ID);
export const gameContext = typedPath<GameContext>(['context']);
export const phaseState = typedPath<PhaseState>(['state', 'core.phase']);
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
  check: (
    intensity: number,
    edged: boolean,
    events: GameEventType[]
  ) => boolean;
  pipes: Pipe;
  scheduleKeys: string[];
};
