import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine';
import { Events } from '../../engine/pipes/Events';
import Messages from './messages';
import { ScheduledEvent, Scheduler } from '../../engine/pipes/Scheduler';
import Saves from './saves';
import { typedPath } from '../../engine/Lens';
import { Settings } from '../../settings/Settings';
import Phase, { GamePhase } from './phase';
import Pause from './pause';
import { PLAY_TIMELINE } from '../timelines';

const PLUGIN_ID = 'core.warmup';

type WarmupState = {
  initialized: boolean;
};

const warmup = pluginPaths<WarmupState>(PLUGIN_ID);
const settings = typedPath<Settings>(['settings']);

const AUTOSTART_KEY = Scheduler.getKey(PLUGIN_ID, 'autoStart');

const eventType = Events.getKeys(PLUGIN_ID, 'start_game');

const Warmup = definePlugin({
  id: PLUGIN_ID,
  meta: {
    name: 'Warmup',
  },

  activate: Composer.set(warmup, { initialized: false }),

  update: Composer.pipe(
    Saves.onSave(PLUGIN_ID, get => ({
      state: get(warmup),
      timers: Scheduler.snapshot(get(), PLUGIN_ID),
    })),
    Saves.onLoad<{ state: WarmupState; timers: ScheduledEvent[] }>(
      PLUGIN_ID,
      data =>
        Composer.pipe(
          Composer.set(warmup, data.state),
          Scheduler.restore(PLUGIN_ID, data.timers)
        )
    ),
    Pause.whenPlaying(
      Phase.whenPhase(
        GamePhase.warmup,
        Composer.do(({ get, set, pipe }) => {
          const s = get(settings);

          if (s.warmupDuration === 0) {
            pipe(Phase.setPhase(GamePhase.active));
            return;
          }

          const state = get(warmup);
          if (state.initialized) return;

          set(warmup.initialized, true);
          pipe(
            Messages.send({
              id: GamePhase.warmup,
              title: 'Get yourself ready!',
              prompts: [
                {
                  title: `I'm ready, $master`,
                  event: { type: eventType.startGame },
                },
              ],
            })
          );
          pipe(
            Scheduler.schedule({
              id: AUTOSTART_KEY,
              duration: s.warmupDuration * 1000,
              timeline: PLAY_TIMELINE,
              event: { type: eventType.startGame },
            })
          );
        })
      )
    ),

    Events.handle(eventType.startGame, () =>
      Composer.pipe(
        Scheduler.cancel(AUTOSTART_KEY),
        Composer.set(warmup, { initialized: false }),
        Messages.send({
          id: GamePhase.warmup,
          title: 'Now follow what I say, $player!',
          duration: 5000,
          prompts: undefined,
        }),
        Phase.setPhase(GamePhase.active)
      )
    )
  ),

  deactivate: Composer.set(warmup, undefined),
});

export default Warmup;
