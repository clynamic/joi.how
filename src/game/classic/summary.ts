import '@awesome.me/webawesome/dist/components/button/button.js';
import { LitElement, html, css } from 'lit';
import { Frames } from '../../engine/Frames';
import { sdk } from '../../engine/sdk';
import Rand, { RandState } from '../rand';
import Clock, { ClockState } from './clock';
import './dice/result';
import './timeline';
import Scene from '../scene';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const SUMMARY_TAG = 'how-joi-classic-summary';

export class ClassicSummaryElement extends LitElement {
  static styles = [
    ...base,
    css`
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--wa-space-l);
        min-height: 100%;
        width: 100%;
        padding: 16px;
        box-sizing: border-box;
      }

      :host > * {
        max-width: 480px;
        width: 100%;
        animation: fade-in-up 500ms cubic-bezier(0.23, 1, 0.32, 1) both;
      }

      :host > :nth-child(1) {
        animation-delay: 100ms;
      }

      :host > :nth-child(2) {
        animation-delay: 250ms;
      }

      :host > :nth-child(3) {
        animation-delay: 400ms;
      }

      h1 {
        margin: 0;
        text-align: center;
        font-size: clamp(2rem, 8vw, 3.5rem);
        font-weight: bold;
        line-height: 1;
      }

      .card {
        display: flex;
        margin-bottom: 14px;
        flex-direction: column;
        gap: var(--wa-space-m);
        padding: 20px;
        background: var(--card-background);
        color: var(--card-color);
        border-radius: var(--border-radius);
        font-size: 0.9rem;
        line-height: 25px;
        box-sizing: border-box;
      }

      hr {
        border: none;
        border-top: 1px solid currentColor;
        width: 100%;
        margin: 0;
      }

      .stats {
        display: flex;
        justify-content: space-around;
      }

      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .value {
        font-size: 1.25rem;
        font-weight: bold;
        color: var(--text-color);
      }

      .seed {
        font-family: monospace;
        font-size: 1rem;
      }

      .label {
        font-size: 0.65rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        opacity: 0.4;
      }

      .actions {
        display: flex;
        justify-content: center;
      }

      wa-button::part(base) {
        height: fit-content;
        padding: 12px 40px;
      }

      wa-button::part(label) {
        font-size: 1.25rem;
        text-transform: uppercase;
      }
    `,
  ];

  private clock = Frames.watch<ClockState>(this, Clock.paths);
  private rand = Frames.watch<RandState>(this, Rand.paths);

  private finish() {
    sdk.inject(Scene.setScene('home'));
  }

  render() {
    const elapsed = this.clock.value?.elapsed ?? 0;
    const seed = this.rand.value?.seed ?? '';
    return html`
      <h1>Game Over</h1>
      <section class="card">
        <how-joi-dice-result></how-joi-dice-result>
        <hr />
        <div class="stats">
          <div class="stat">
            <span class="value">${Clock.format(elapsed)}</span>
            <span class="label">Play time</span>
          </div>
          <div class="stat">
            <span class="value seed">${seed}</span>
            <span class="label">Seed</span>
          </div>
        </div>
        <hr />
        <how-joi-classic-timeline></how-joi-classic-timeline>
      </section>
      <div class="actions">
        <wa-button size="large" @click=${this.finish}>Finish</wa-button>
      </div>
    `;
  }
}

defineElement(SUMMARY_TAG, ClassicSummaryElement);

declare global {
  interface HTMLElementTagNameMap {
    [SUMMARY_TAG]: ClassicSummaryElement;
  }
}
