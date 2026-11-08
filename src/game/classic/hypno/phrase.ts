import { LitElement, html, css, nothing } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { playerKeys } from '../../player';
import { translateWith } from '../../translate';
import Intensity, { IntensityState } from '../intensity';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';
import Hypno, {
  hypnoKeys,
  GameHypnoType,
  HypnoPhrases,
  HypnoState,
} from './index';

export const HYPNO_TAG = 'how-joi-classic-hypno';

export class ClassicHypnoElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
        pointer-events: none;
      }

      @keyframes fade {
        from {
          opacity: 0.3;
        }
        to {
          opacity: 0;
        }
      }

      .phrase {
        font-size: 4rem;
        font-weight: bold;
        -webkit-text-stroke: black 1px;
        animation: fade var(--fade) cubic-bezier(0.19, 1, 0.22, 1) forwards;
      }
    `,
  ];

  private hypno = Frames.watch<HypnoState>(this, Hypno.paths);
  private keys = Frames.watch<Document>(this, hypnoKeys.path);
  private intensity = Frames.watch<IntensityState>(this, Intensity.paths);
  private player = Frames.watch<Document>(this, playerKeys.path);

  private current() {
    if (!this.hypno.value) return null;
    const { hypno } = hypnoKeys.from(this.keys.value);
    if (hypno === GameHypnoType.off) return null;
    const phrases = HypnoPhrases[hypno];
    if (phrases.length <= 0) return null;
    const index = this.hypno.value.currentPhrase ?? 0;
    const { gender, body } = playerKeys.from(this.player.value);
    const text = translateWith(
      { gender, body, hypno },
      phrases[index % phrases.length]
    );
    if (!text) return null;
    const intensity = this.intensity.value?.intensity ?? 0;
    const fade = (3000 - intensity * 100 * 29) * 0.5;
    return { key: `${text}-${index}`, text, fade };
  }

  render() {
    const current = this.current();
    if (!current) return nothing;
    return keyed(
      current.key,
      html`<div class="phrase" style="--fade: ${current.fade}ms">
        ${current.text}
      </div>`
    );
  }
}

defineElement(HYPNO_TAG, ClassicHypnoElement);

declare global {
  interface HTMLElementTagNameMap {
    [HYPNO_TAG]: ClassicHypnoElement;
  }
}
