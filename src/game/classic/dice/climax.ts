import { Composer } from '../../../engine/Composer';
import { typedPath } from '../../../engine/Lens';
import { Module } from '../../../engine/modules/Module';
import { Pipe } from '../../../engine/State';
import { Sequence } from '../../Sequence';
import Phase, { GamePhase } from '../../phase';
import Scene from '../../scene';
import Pace from '../pace';
import Rand from '../../rand';
import { IntensityState } from '../intensity';
import Presets from '../../presets';
import { PLUGIN_ID, intensityState, outcomeDone } from './types';

export type ClimaxResultType = 'climax' | 'denied' | 'ruined' | null;

type ClimaxState = {
  result: ClimaxResultType;
};

export const climax = typedPath<ClimaxState>([PLUGIN_ID, 'climax']);

export const climaxKeys = Presets.keys(`${PLUGIN_ID}.climax`, {
  climaxChance: 100,
  ruinChance: 0,
});

type ClimaxEndPayload = { countdown: number; denied?: boolean; ruin?: boolean };

const seq = Sequence.for(PLUGIN_ID, 'climax');

export const climaxModule: Module = {
  id: `${PLUGIN_ID}.climax`,
  ordering: { loadAfter: [PLUGIN_ID] },
  deactivate: Composer.set(climax, undefined),
  update: Composer.pipe(
    seq.on(() =>
      Composer.do(({ get, pipe }) =>
        pipe(
          Pace.setPace(Pace.bounds(get()).min),
          seq.message({
            title: `You should be getting close to the edge. Don't cum yet.`,
            duration: 10000,
          }),
          seq.after(10000, 'edgePush')
        )
      )
    ),

    seq.on('edgePush', () =>
      Composer.do(({ get, pipe }) =>
        pipe(
          Pace.setPace(Pace.bounds(get()).max),
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
      Composer.do(({ get, pipe }) =>
        pipe(
          seq.message({
            title: 'Stay on the edge, $player',
            prompts: undefined,
          }),
          Pace.setPace(Pace.bounds(get()).min),
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
      Composer.do(({ get, pipe }) => {
        const s = climaxKeys.get(get());
        pipe(
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
        );
      })
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
            title: 'Good job, $player',
            prompts: [seq.prompt('Leave', 'leave')],
          })
        );
      }
      const clench: Pipe =
        ruin && countdown === 10
          ? seq.message({ title: 'Clench in desperation' })
          : Composer.pipe();
      return Composer.pipe(
        clench,
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
      Composer.do(({ get, pipe }) =>
        pipe(
          seq.message({ title: 'Start to $stroke again', duration: 5000 }),
          Pace.setPace(Pace.bounds(get()).min),
          Phase.setPhase(GamePhase.active),
          outcomeDone()
        )
      )
    ),

    seq.on('leave', () => Scene.setScene('end'))
  ),
};
