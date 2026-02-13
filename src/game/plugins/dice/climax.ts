import { Composer } from '../../../engine/Composer';
import { Events, getEventKey } from '../../../engine/pipes/Events';
import { Messages } from '../../../engine/pipes/Messages';
import { Scheduler, getScheduleKey } from '../../../engine/pipes/Scheduler';
import Phase, { GamePhase } from '../phase';
import Pace from '../pace';
import { GameEvent as GameEventType } from '../../../types';
import { IntensityState } from '../intensity';
import {
  PLUGIN_ID,
  intensityState,
  settings,
  setBusy,
  DiceOutcome,
} from './types';

const ev = {
  climax: getEventKey(PLUGIN_ID, 'climax'),
  edging: getEventKey(PLUGIN_ID, 'climax.edging'),
  cant: getEventKey(PLUGIN_ID, 'climax.cant'),
  countdown3: getEventKey(PLUGIN_ID, 'climax.countdown3'),
  countdown2: getEventKey(PLUGIN_ID, 'climax.countdown2'),
  countdown1: getEventKey(PLUGIN_ID, 'climax.countdown1'),
  resolve: getEventKey(PLUGIN_ID, 'climax.resolve'),
  end: getEventKey(PLUGIN_ID, 'climax.end'),
  cantResume: getEventKey(PLUGIN_ID, 'climax.cantResume'),
  cantEnd: getEventKey(PLUGIN_ID, 'climax.cantEnd'),
  leave: getEventKey(PLUGIN_ID, 'leave'),
};

const sched = {
  countdown3: getScheduleKey(PLUGIN_ID, 'climax.countdown3'),
  countdown2: getScheduleKey(PLUGIN_ID, 'climax.countdown2'),
  countdown1: getScheduleKey(PLUGIN_ID, 'climax.countdown1'),
  resolve: getScheduleKey(PLUGIN_ID, 'climax.resolve'),
  end: getScheduleKey(PLUGIN_ID, 'climax.end'),
  cantResume: getScheduleKey(PLUGIN_ID, 'climax.cantResume'),
  cantEnd: getScheduleKey(PLUGIN_ID, 'climax.cantEnd'),
};

export const climaxOutcome: DiceOutcome = {
  id: GameEventType.climax,
  check: (intensity, edged, events) =>
    intensity >= 100 && (!events.includes(GameEventType.edge) || edged),
  scheduleKeys: Object.values(sched),
  pipes: Composer.pipe(
    Events.handle(ev.climax, () =>
      Composer.pipe(
        Phase.setPhase(GamePhase.finale),
        Messages.send({
          id: GameEventType.climax,
          title: 'Are you edging?',
          prompts: [
            {
              title: "I'm edging, $master",
              event: { type: ev.edging },
            },
            {
              title: "I can't",
              event: { type: ev.cant },
            },
          ],
        })
      )
    ),

    Events.handle(ev.edging, () =>
      Composer.do(({ get, pipe }) => {
        const s = get(settings);
        if (!s) return;
        pipe(
          Messages.send({
            id: GameEventType.climax,
            title: 'Stay on the edge, $player',
            prompts: undefined,
          })
        );
        pipe(Pace.setPace(s.minPace));
        pipe(
          Scheduler.schedule({
            id: sched.countdown3,
            duration: 3000,
            event: { type: ev.countdown3 },
          })
        );
      })
    ),

    Events.handle(ev.countdown3, () =>
      Composer.pipe(
        Messages.send({ id: GameEventType.climax, description: '3...' }),
        Scheduler.schedule({
          id: sched.countdown2,
          duration: 5000,
          event: { type: ev.countdown2 },
        })
      )
    ),

    Events.handle(ev.countdown2, () =>
      Composer.pipe(
        Messages.send({ id: GameEventType.climax, description: '2...' }),
        Scheduler.schedule({
          id: sched.countdown1,
          duration: 5000,
          event: { type: ev.countdown1 },
        })
      )
    ),

    Events.handle(ev.countdown1, () =>
      Composer.pipe(
        Messages.send({ id: GameEventType.climax, description: '1...' }),
        Scheduler.schedule({
          id: sched.resolve,
          duration: 5000,
          event: { type: ev.resolve },
        })
      )
    ),

    Events.handle(ev.resolve, () =>
      Composer.do(({ get, pipe }) => {
        const s = get(settings);
        if (!s) return;

        if (Math.random() * 100 <= s.climaxChance) {
          const ruin = Math.random() * 100 <= s.ruinChance;
          if (ruin) {
            pipe(Phase.setPhase(GamePhase.break));
            pipe(
              Messages.send({
                id: GameEventType.climax,
                title: '$HANDS OFF! Ruin your orgasm!',
                description: undefined,
              })
            );
          } else {
            pipe(Phase.setPhase(GamePhase.climax));
            pipe(
              Messages.send({
                id: GameEventType.climax,
                title: 'Cum!',
                description: undefined,
              })
            );
          }
          pipe(
            Scheduler.schedule({
              id: sched.end,
              duration: 3000,
              event: {
                type: ev.end,
                payload: { countdown: 10, ruin },
              },
            })
          );
        } else {
          pipe(Phase.setPhase(GamePhase.break));
          pipe(
            Messages.send({
              id: GameEventType.climax,
              title: '$HANDS OFF! Do not cum!',
              description: undefined,
            })
          );
          pipe(
            Scheduler.schedule({
              id: sched.end,
              duration: 1000,
              event: {
                type: ev.end,
                payload: { countdown: 5, denied: true },
              },
            })
          );
        }
      })
    ),

    Events.handle(ev.end, event =>
      Composer.do(({ pipe }) => {
        const { countdown, denied, ruin } = event.payload;

        pipe(
          Composer.over(intensityState, (s: IntensityState) => ({
            intensity: Math.max(0, s.intensity - (denied ? 0.2 : 0.1)),
          }))
        );

        if (countdown <= 1) {
          if (denied) {
            pipe(
              Messages.send({
                id: GameEventType.climax,
                title: 'Good $player. Let yourself cool off',
              })
            );
            pipe(
              Scheduler.schedule({
                id: sched.cantEnd,
                duration: 5000,
                event: { type: ev.cantEnd },
              })
            );
          } else {
            pipe(
              Messages.send({
                id: GameEventType.climax,
                title: ruin ? 'Clench in desperation' : 'Good job, $player',
                prompts: [
                  {
                    title: 'Leave',
                    event: { type: ev.leave },
                  },
                ],
              })
            );
          }
        } else {
          pipe(
            Scheduler.schedule({
              id: sched.end,
              duration: 1000,
              event: {
                type: ev.end,
                payload: { countdown: countdown - 1, denied, ruin },
              },
            })
          );
        }
      })
    ),

    Events.handle(ev.cantEnd, () =>
      Messages.send({
        id: GameEventType.climax,
        title: 'Leave now.',
        prompts: [
          {
            title: 'Leave',
            event: { type: ev.leave },
          },
        ],
      })
    ),

    Events.handle(ev.cant, () =>
      Composer.do(({ pipe }) => {
        pipe(
          Messages.send({
            id: GameEventType.climax,
            title: "You're pathetic. Stop for a moment",
            prompts: undefined,
          })
        );
        pipe(Phase.setPhase(GamePhase.break));
        pipe(Composer.set(intensityState.intensity, 0));
        pipe(
          Scheduler.schedule({
            id: sched.cantResume,
            duration: 20000,
            event: { type: ev.cantResume },
          })
        );
      })
    ),

    Events.handle(ev.cantResume, () =>
      Composer.do(({ get, pipe }) => {
        const s = get(settings);
        if (!s) return;
        pipe(
          Messages.send({
            id: GameEventType.climax,
            title: 'Start to $stroke again',
            duration: 5000,
          })
        );
        pipe(Pace.setPace(s.minPace));
        pipe(Phase.setPhase(GamePhase.active));
        pipe(setBusy(false));
      })
    ),

    Events.handle(ev.leave, () =>
      Composer.do(() => {
        window.location.href = '/';
      })
    )
  ),
};
