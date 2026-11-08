import { LitElement, html, css, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { Frames } from '../../engine/Frames';
import Pause, { PauseState } from './index';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const COUNTDOWN_TAG = 'how-joi-pause-countdown';

const display = (countdown: number) =>
  countdown === 4 ? 'Ready?' : `${countdown}`;

export class PauseCountdownElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 10;
      }

      @keyframes pop {
        from {
          transform: scale(0.5);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes leave {
        to {
          transform: scale(1.5);
          opacity: 0;
        }
      }

      .number {
        font-size: clamp(3rem, 15vw, 8rem);
        font-weight: bold;
        color: var(--overlay-color);
        animation: pop 0.4s cubic-bezier(0.23, 1, 0.32, 1) both;
      }

      .number.leave {
        animation: leave 0.4s cubic-bezier(0.23, 1, 0.32, 1) both;
      }
    `,
  ];

  private pause = Frames.watch<PauseState>(this, Pause.paths);

  @state() private accessor leaving: string | null = null;

  private shown: string | null = null;

  willUpdate() {
    const countdown = this.pause.value?.countdown;
    const text = countdown == null ? null : display(countdown);
    if (text === null && this.shown !== null) {
      const leaving = this.shown;
      this.leaving = leaving;
      setTimeout(() => {
        if (this.leaving === leaving) this.leaving = null;
      }, 400);
    }
    this.shown = text;
  }

  render() {
    const countdown = this.pause.value?.countdown;
    if (countdown == null) {
      return this.leaving
        ? html`<div class="number leave">${this.leaving}</div>`
        : nothing;
    }
    return keyed(
      countdown,
      html`<div class="number">${display(countdown)}</div>`
    );
  }
}

defineElement(COUNTDOWN_TAG, PauseCountdownElement);

declare global {
  interface HTMLElementTagNameMap {
    [COUNTDOWN_TAG]: PauseCountdownElement;
  }
}
