import { Pipe } from '../../engine/State';
import { Effects } from '../../engine/pipes/Effects';
import { Events } from '../../engine/pipes/Events';
import { Scheduler } from '../../engine/pipes/Scheduler';
import { Perf } from '../../engine/pipes/Perf';
import { Errors } from '../../engine/pipes/Errors';
import { Impulses } from '../../engine/Impulses';

export const gamePipes = (impulses: Impulses, plugins: Pipe[]): Pipe[] => [
  Effects.pipe,
  impulses.pipe,
  Events.pipe,
  Scheduler.pipe,
  Perf.pipe,
  Errors.pipe,
  ...plugins,
];
