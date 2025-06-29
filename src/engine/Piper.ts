import { Pipe } from './State';
import { Composer } from './Composer';

export const Piper = (pipes: Pipe[]): Pipe =>
  Composer.chain(c => c.pipe(...pipes));
