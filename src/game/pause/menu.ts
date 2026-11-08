import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css } from 'lit';
import { state } from 'lit/decorators.js';
import { Frames } from '../../engine/Frames';
import { sdk } from '../../engine/sdk';
import Scene, { SceneState } from '../scene';
import Pause, { PauseState } from './index';
import { base } from '../../elements/base';
import { BackController } from '../../elements/back';
import { defineElement } from '../../engine/defineElement';

export const PAUSE_MENU_TAG = 'how-joi-pause-menu';

export class PauseMenuElement extends LitElement {
  static styles = [
    ...base,
    css`
      .trigger {
        display: flex;
        height: fit-content;
        align-items: center;
        justify-content: center;
        border-radius: 0 var(--border-radius) 0 0;
        background: var(--overlay-background);
        color: var(--overlay-color);
        padding: var(--wa-space-2xs);
      }

      wa-dialog::part(dialog) {
        background-color: transparent;
        box-shadow: none;
      }

      wa-dialog::part(header) {
        justify-content: center;
      }

      wa-dialog::part(title) {
        text-align: center;
      }

      wa-dialog::part(close-button) {
        display: none;
      }

      wa-dialog::part(body) {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: var(--wa-space-m);
        max-width: 300px;
        padding: var(--wa-space-l) 0;
        margin: 0 auto;
      }

      .menu::part(base) {
        padding: var(--wa-space-l) var(--wa-space-2xl);
        background: var(--overlay-background);
        border-radius: var(--wa-form-control-border-radius);
        font-size: 1.25rem;
      }

      .menu::part(base):hover {
        background: var(--wa-color-brand);
      }
    `,
  ];

  private pause = Frames.watch<PauseState>(this, Pause.paths);
  private scene = Frames.watch<SceneState>(this, Scene.paths);
  private back = new BackController(this, () => {
    if (this.visible()) sdk.inject(Pause.setPaused(false));
  });

  private visible() {
    const { paused, countdown } = this.pause.value ?? {};
    return (
      this.scene.value?.current === 'game' && !!paused && countdown == null
    );
  }

  updated() {
    if (this.visible()) this.back.open();
    else this.back.close();
  }

  @state() private accessor fullscreen = false;

  private onFullscreenChange = () => {
    this.fullscreen = document.fullscreenElement === document.documentElement;
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('fullscreenerror', this.onFullscreenChange);
    this.onFullscreenChange();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('fullscreenerror', this.onFullscreenChange);
  }

  private toggleFullscreen() {
    if (this.fullscreen) {
      if (document.fullscreenElement) document.exitFullscreen();
      return;
    }
    document.documentElement.requestFullscreen().catch(e => {
      console.error(
        `Error attempting to enable full-screen mode: ${e.message} (${e.name})`
      );
    });
  }

  private onHide(event: Event) {
    const dialog = event.currentTarget as HTMLElement;
    if (event.target === dialog && dialog.querySelector('wa-dialog[open]')) {
      event.preventDefault();
    }
  }

  private onAfterHide(event: Event) {
    if (event.target !== event.currentTarget) return;
    if (this.pause.value?.countdown != null) return;
    if (this.scene.value?.current !== 'game') return;
    sdk.inject(Pause.setPaused(false));
  }

  render() {
    const visible = this.visible();
    return html`
      <div class="trigger">
        <wa-button
          aria-label="Menu"
          size="large"
          @click=${() => sdk.inject(Pause.setPaused(true))}
        >
          <wa-icon name="bars"></wa-icon>
        </wa-button>
      </div>
      <wa-dialog
        label="Paused"
        .open=${visible}
        @wa-hide=${this.onHide}
        @wa-after-hide=${this.onAfterHide}
      >
        <wa-button
          class="menu"
          size="large"
          @click=${() => sdk.inject(Pause.setPaused(false))}
        >
          <wa-icon slot="start" name="play"></wa-icon>
          <span>Resume</span>
        </wa-button>
        <wa-button class="menu" size="large" @click=${this.toggleFullscreen}>
          <wa-icon
            slot="start"
            name=${this.fullscreen ? 'compress' : 'expand'}
          ></wa-icon>
          <span>${this.fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
        </wa-button>
        <wa-button
          class="menu"
          size="large"
          @click=${() => sdk.inject(Scene.setScene('home'))}
        >
          <wa-icon slot="start" name="gear"></wa-icon>
          <span>Settings</span>
        </wa-button>
        <wa-button
          class="menu"
          size="large"
          variant="danger"
          @click=${() => sdk.inject(Scene.setScene('end'))}
        >
          <wa-icon slot="start" name="right-from-bracket"></wa-icon>
          <span>End Game</span>
        </wa-button>
      </wa-dialog>
    `;
  }
}

defineElement(PAUSE_MENU_TAG, PauseMenuElement);

declare global {
  interface HTMLElementTagNameMap {
    [PAUSE_MENU_TAG]: PauseMenuElement;
  }
}
