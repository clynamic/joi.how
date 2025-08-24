import { Composer, Pipe } from '../../engine';
import { EventContext, getEventKey } from '../../engine/pipes/Events';
import { MessageContext } from '../../engine/pipes/Messages';
import { getScheduleKey, SchedulerContext } from '../../engine/pipes/Scheduler';
import { GamePhase, setPhase } from './Phase';
import { Settings } from '../../settings';

const PLUGIN_NAMESPACE = 'core.warmup';

export type WarmupState = {
  initialized: boolean;
};

export const warmupPipe: Pipe = Composer.chain(c => {
  const { sendMessage } = c.get<MessageContext>(['context', 'core.messages']);
  const { handle } = c.get<EventContext>(['context', 'core.events']);
  const { schedule, cancel } = c.get<SchedulerContext>([
    'context',
    'core.scheduler',
  ]);

  return c
    .bind<GamePhase>(['state', 'core.phase', 'current'], currentPhase =>
      Composer.bind<Settings>(['context', 'settings'], settings =>
        Composer.bind<WarmupState>(
          ['state', PLUGIN_NAMESPACE],
          (state = { initialized: false }) =>
            Composer.when(currentPhase === GamePhase.warmup, frame =>
              frame
                .when(settings.warmupDuration === 0, f =>
                  f.pipe(setPhase(GamePhase.active))
                )
                .when(settings.warmupDuration > 0 && !state.initialized, f =>
                  f.pipe(
                    Composer.set<WarmupState>(PLUGIN_NAMESPACE, {
                      initialized: true,
                    }),
                    sendMessage({
                      id: GamePhase.warmup,
                      title: 'Get yourself ready!',
                      prompts: [
                        {
                          title: `I'm ready, $master`,
                          event: {
                            type: getEventKey(PLUGIN_NAMESPACE, 'startGame'),
                          },
                        },
                      ],
                    }),
                    schedule({
                      id: getScheduleKey(PLUGIN_NAMESPACE, 'autoStart'),
                      duration: settings.warmupDuration * 1000,
                      event: {
                        type: getEventKey(PLUGIN_NAMESPACE, 'startGame'),
                      },
                    })
                  )
                )
            )
        )
      )
    )

    .pipe(
      handle(getEventKey(PLUGIN_NAMESPACE, 'startGame'), () =>
        Composer.pipe(
          cancel(getScheduleKey(PLUGIN_NAMESPACE, 'autoStart')),
          Composer.set<WarmupState>(PLUGIN_NAMESPACE, {
            initialized: false,
          }),
          sendMessage({
            id: GamePhase.warmup,
            title: 'Now follow what I say, $player!',
            duration: 5000,
            prompts: undefined,
          }),
          setPhase(GamePhase.active)
        )
      )
    );
});
