import '@awesome.me/webawesome/dist/components/button/button.js';
import { LitElement, html, css, nothing } from 'lit';
import { Frames } from '../../engine/Frames';
import { Document } from '../../engine/plugins/Documents';
import { sdk } from '../../engine/sdk';
import Saves, { Restored } from '../saves';
import Scene from '../scene';
import ClassicImages from './images';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const START_TAG = 'how-joi-classic-start';

const savedAgo = (savedAt: number): string => {
  const minutes = Math.round((Date.now() - savedAt) / 60000);
  if (minutes < 1) return 'saved just now';
  if (minutes < 60) return `saved ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `saved ${hours} h ago`;
  return `saved ${Math.round(hours / 24)} days ago`;
};

export class ClassicStartElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        width: 100%;
        box-sizing: border-box;
        font-size: 0.9rem;
        line-height: 25px;
      }

      .warning {
        text-align: center;
        margin-bottom: 1rem;
      }

      .row {
        position: relative;
        display: flex;
        justify-content: center;
      }

      .begin::part(base) {
        height: fit-content;
        padding: 15px 20px;
      }

      .begin::part(label) {
        font-size: 1.5rem;
        text-transform: uppercase;
      }

      .aside {
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        margin-left: 1rem;
        white-space: nowrap;
      }

      .saved {
        margin: 0;
        opacity: 0.7;
        font-size: 0.9rem;
      }
    `,
  ];

  private selection = Frames.watch<Document>(this, ClassicImages.keys.path);
  private saves = Frames.watch<{ restored?: Restored | null }>(
    this,
    Saves.paths
  );

  private start(fresh?: Restored) {
    if (fresh) sdk.inject(Saves.fresh(fresh.slot));
    sdk.inject(Scene.setScene('game'));
  }

  render() {
    const { images } = ClassicImages.keys.from(this.selection.value);
    const restored = this.saves.value?.restored ?? null;
    const empty = images.length === 0;
    return html`
      ${empty
        ? html`<p class="warning">Lets add some images before we start!</p>`
        : nothing}
      <div class="row">
        <wa-button
          class="begin"
          ?disabled=${empty}
          @click=${() => this.start()}
        >
          ${restored ? 'continue' : 'begin'}
        </wa-button>
        ${restored
          ? html`<div class="aside">
              <wa-button
                size="small"
                appearance="plain"
                ?disabled=${empty}
                @click=${() => this.start(restored)}
              >
                New game
              </wa-button>
            </div>`
          : nothing}
      </div>
      ${restored
        ? html`<p class="saved">${savedAgo(restored.savedAt)}</p>`
        : nothing}
    `;
  }
}

defineElement(START_TAG, ClassicStartElement);

declare global {
  interface HTMLElementTagNameMap {
    [START_TAG]: ClassicStartElement;
  }
}
