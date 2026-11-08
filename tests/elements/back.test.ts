import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReactiveControllerHost } from 'lit';
import { BackController } from '../../src/elements/back';

const host = (): ReactiveControllerHost & { controllers: BackController[] } => {
  const controllers: BackController[] = [];
  return {
    controllers,
    addController: c => controllers.push(c as BackController),
    removeController: () => undefined,
    requestUpdate: () => undefined,
    updateComplete: Promise.resolve(true),
  };
};

const popped = () =>
  new Promise<void>(resolve =>
    window.addEventListener('popstate', () => resolve(), { once: true })
  );

describe('BackController', () => {
  beforeEach(() => {
    history.replaceState(null, '', '/');
  });

  it('closes the overlay when the person goes back', async () => {
    const onBack = vi.fn();
    const h = host();
    const back = new BackController(h, onBack);
    back.hostConnected();
    const before = history.length;
    back.open();
    expect(history.length).toBe(before + 1);
    const wait = popped();
    history.back();
    await wait;
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('drops its entry when the overlay closes on its own', async () => {
    const onBack = vi.fn();
    const h = host();
    const back = new BackController(h, onBack);
    back.hostConnected();
    back.open();
    const wait = popped();
    back.close();
    await wait;
    expect(history.state?.back).toBeUndefined();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('leaves history alone when another entry sits on top', async () => {
    const onBack = vi.fn();
    const h = host();
    const back = new BackController(h, onBack);
    back.hostConnected();
    back.open();
    history.pushState(null, '', '/end');
    back.close();
    await new Promise(r => setTimeout(r, 20));
    expect(location.pathname).toBe('/end');
    expect(onBack).not.toHaveBeenCalled();
  });

  it('ignores a pop while closed', async () => {
    const onBack = vi.fn();
    const h = host();
    const back = new BackController(h, onBack);
    back.hostConnected();
    history.pushState(null, '', '/play');
    const wait = popped();
    history.back();
    await wait;
    expect(onBack).not.toHaveBeenCalled();
  });
});
