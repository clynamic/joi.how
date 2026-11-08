import { ReactiveController, ReactiveControllerHost } from 'lit';

const KEY = 'back';
let count = 0;

export class BackController implements ReactiveController {
  private id = `${KEY}-${++count}`;
  private active = false;

  constructor(
    host: ReactiveControllerHost,
    private onBack: () => void
  ) {
    host.addController(this);
  }

  hostConnected() {
    window.addEventListener('popstate', this.onPop);
  }

  hostDisconnected() {
    window.removeEventListener('popstate', this.onPop);
    this.active = false;
  }

  open() {
    if (this.active) return;
    this.active = true;
    history.pushState({ ...(history.state ?? {}), [KEY]: this.id }, '');
  }

  close() {
    if (!this.active) return;
    this.active = false;
    if (history.state?.[KEY] === this.id) history.back();
  }

  private onPop = () => {
    if (!this.active) return;
    if (history.state?.[KEY] === this.id) return;
    this.active = false;
    this.onBack();
  };
}
