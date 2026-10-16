import _ from 'lodash';
import { definePlugin, pluginPaths } from '../../engine/plugins/Plugins';
import { Composer } from '../../engine/Composer';
import { typedPath } from '../../engine/Lens';
import { Pipe } from '../../engine/State';
import Sound from './sound';
import { GamePhase, PhaseState } from './phase';
import { StrokeDirection, StrokeState } from './stroke';
import { GameMessage, MessageState } from './messages';

const PLUGIN_ID = 'core.cues';

const STROKE_UP_TONE = 425;
const STROKE_DOWN_TONE = 625;
const MESSAGE_TONE = 200;
const BREAK_CHIME = [400, 300, 250, 200, 200];
const RESUME_CHIME = [200, 300, 350, 400, 400];
const CLIMAX_SWEEP = Array.from({ length: 15 }, (_, i) => 255 - i * 6);
const CLIMAX_GAP = 400;

type CuesState = {
  stroke?: StrokeDirection;
  phase?: string;
  messages: GameMessage[];
};

const paths = pluginPaths<CuesState>(PLUGIN_ID);
const strokeState = typedPath<StrokeState>(['core.stroke']);
const phaseState = typedPath<PhaseState>(['core.phase']);
const messageState = typedPath<MessageState>(['core.messages']);

const strokeCue: Pipe = Composer.do(({ get, set, pipe }) => {
  const state = get(paths);
  const stroke = get(strokeState)?.stroke;
  if (!state || !stroke || stroke === state.stroke) return;
  set(paths.stroke, stroke);
  pipe(
    Sound.play(
      stroke === StrokeDirection.up ? STROKE_UP_TONE : STROKE_DOWN_TONE
    )
  );
});

const phaseCue: Pipe = Composer.do(({ get, set, pipe }) => {
  const state = get(paths);
  const phase = get(phaseState)?.current;
  if (!state || !phase || phase === state.phase) return;
  const previous = state.phase;
  set(paths.phase, phase);
  if (phase === GamePhase.break) pipe(Sound.chime(BREAK_CHIME));
  if (previous === GamePhase.break && phase === GamePhase.active)
    pipe(Sound.chime(RESUME_CHIME));
  if (phase === GamePhase.climax) pipe(Sound.chime(CLIMAX_SWEEP, CLIMAX_GAP));
});

const messageCue: Pipe = Composer.do(({ get, set, pipe }) => {
  const state = get(paths);
  const messages = get(messageState)?.messages;
  if (!state || !messages || messages === state.messages) return;
  set(paths.messages, messages);
  const changed = messages.some(message => {
    const previous = state.messages.find(m => m.id === message.id);
    return !previous || !_.isEqual(previous, message);
  });
  if (changed) pipe(Sound.play(MESSAGE_TONE));
});

const Cues = definePlugin({
  sdk: 'Cues',
  id: PLUGIN_ID,
  meta: {
    name: 'Cues',
  },

  activate: Composer.do(({ get, set }) => {
    set(paths, {
      stroke: get(strokeState)?.stroke,
      phase: get(phaseState)?.current,
      messages: get(messageState)?.messages ?? [],
    });
  }),

  update: Composer.pipe(strokeCue, phaseCue, messageCue),

  deactivate: Composer.set(paths, undefined),

  get paths() {
    return paths;
  },
});

declare module '../../engine/sdk' {
  interface PluginSDK {
    Cues: typeof Cues;
  }
}

export default Cues;
