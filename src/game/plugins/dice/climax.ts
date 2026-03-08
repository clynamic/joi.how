import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { Module } from '../../../engine/modules/Module';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../phase';
import Scene from '../scene';
import Pace from '../pace';
import Rand from '../rand';
import { IntensityState } from '../intensity';
import { PLUGIN_ID, intensityState, settings, outcomeDone } from './types';

export type ClimaxResultType = 'climax' | 'denied' | 'ruined' | null;

type ClimaxState = {
  result: ClimaxResultType;
};

export const climax = typedPath<ClimaxState>([PLUGIN_ID, 'climax']);

type ClimaxEndPayload = { countdown: number; denied?: boolean; ruin?: boolean };

const seq = Sequence.for(PLUGIN_ID, 'climax');

export const climaxModule: Module = {
  id: `${PLUGIN_ID}.climax`,
  ordering: { loadAfter: [PLUGIN_ID] },
  deactivate: Composer.set(climax, undefined),
  update: Composer.pipe(
    seq.on(() =>
      Composer.bind(settings, s =>
        Composer.pipe(
          Pace.setPace(s.minPace),
          seq.message({
            title: `You should be getting close to the edge. Don't cum yet.`,
            duration: 10000,
          }),
          seq.after(10000, 'edgePush')
        )
      )
    ),

    seq.on('edgePush', () =>
      Composer.bind(settings, s =>
        Composer.pipe(
          Pace.setPace(s.maxPace),
          seq.message({
            title: `Keep going!`,
            duration: 20000,
          }),
          seq.after(20000, 'finale')
        )
      )
    ),

    seq.on('finale', () =>
      Composer.pipe(
        Phase.setPhase(GamePhase.finale),
        seq.message({
          title: 'Are you edging?',
          prompts: [
            seq.prompt("I'm edging, $master", 'edging'),
            seq.prompt("I can't", 'cant'),
          ],
        })
      )
    ),

    seq.on('edging', () =>
      Composer.bind(settings, s =>
        Composer.pipe(
          seq.message({
            title: 'Stay on the edge, $player',
            prompts: undefined,
          }),
          Pace.setPace(s.minPace),
          seq.after(3000, 'countdown3')
        )
      )
    ),

    seq.on('countdown3', () =>
      Composer.pipe(
        seq.message({ description: '3...' }),
        seq.after(5000, 'countdown2')
      )
    ),

    seq.on('countdown2', () =>
      Composer.pipe(
        seq.message({ description: '2...' }),
        seq.after(5000, 'countdown1')
      )
    ),

    seq.on('countdown1', () =>
      Composer.pipe(
        seq.message({ description: '1...' }),
        seq.after(5000, 'resolve')
      )
    ),

    seq.on('resolve', () =>
      Composer.bind(settings, s =>
        Rand.next(roll => {
          if (roll * 100 > s.climaxChance) {
            return Composer.pipe(
              Composer.set(climax.result, 'denied'),
              Phase.setPhase(GamePhase.break),
              seq.message({
                title: '$HANDS OFF! Do not cum!',
                description: undefined,
              }),
              seq.after(1000, 'end', { countdown: 5, denied: true })
            );
          }
          return Rand.next(ruinRoll => {
            const ruin = ruinRoll * 100 <= s.ruinChance;
            return Composer.pipe(
              Composer.set(climax.result, ruin ? 'ruined' : 'climax'),
              Phase.setPhase(ruin ? GamePhase.break : GamePhase.climax),
              seq.message({
                title: ruin ? '$HANDS OFF! Ruin your orgasm!' : 'Cum!',
                description: undefined,
              }),
              seq.after(3000, 'end', { countdown: 10, ruin })
            );
          });
        })
      )
    ),

    seq.on<ClimaxEndPayload>('end', event => {
      const { countdown, denied, ruin } = event.payload;
      const decay = Composer.over(intensityState, (s: IntensityState) => ({
        intensity: Math.max(0, s.intensity - (denied ? 0.2 : 0.1)),
      }));
      if (countdown <= 1) {
        if (denied) {
          return Composer.pipe(
            decay,
            seq.message({ title: 'Good $player. Let yourself cool off' }),
            seq.after(5000, 'cantEnd')
          );
        }
        return Composer.pipe(
          decay,
          seq.message({
            title: ruin ? 'Clench in desperation' : 'Good job, $player',
            prompts: [seq.prompt('Leave', 'leave')],
          })
        );
      }
      return Composer.pipe(
        decay,
        seq.after(1000, 'end', { countdown: countdown - 1, denied, ruin })
      );
    }),

    seq.on('cantEnd', () =>
      seq.message({
        title: 'Leave now.',
        prompts: [seq.prompt('Leave', 'leave')],
      })
    ),

    seq.on('cant', () =>
      Composer.pipe(
        seq.message({
          title: "You're pathetic. Stop for a moment",
          prompts: undefined,
        }),
        Phase.setPhase(GamePhase.break),
        Composer.set(intensityState.intensity, 0),
        seq.after(20000, 'cantResume')
      )
    ),

    seq.on('cantResume', () =>
      Composer.bind(settings, s =>
        Composer.pipe(
          seq.message({ title: 'Start to $stroke again', duration: 5000 }),
          Pace.setPace(s.minPace),
          Phase.setPhase(GamePhase.active),
          outcomeDone()
        )
      )
    ),

    seq.on('leave', () => Scene.setScene('end'))
  ),
};
