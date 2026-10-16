import { Composer } from './Composer';
import { Pipe } from './State';

export class Impulses {
  private pending: Pipe[] = [];

  push(pipe: Pipe): void {
    this.pending.push(pipe);
  }

  clear(): void {
    this.pending = [];
  }

  get pipe(): Pipe {
    return frame => {
      const batch = this.pending;
      this.pending = [];
      return Composer.pipe(...batch)(frame);
    };
  }
}
