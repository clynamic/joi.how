import { LitElement, html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { keyed } from 'lit/directives/keyed.js';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { playerKeys } from '../../player';
import { translateWith } from '../../translate';
import Intensity, { IntensityState } from '../intensity';
import { base } from '../../../elements/base';
import Hypno, {
  hypnoKeys,
  GameHypnoType,
  HypnoPhrases,
  HypnoState,
} from './index';

export const HYPNO_TAG = 'how-joi-classic-hypno';

@customElement(HYPNO_TAG)
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

  render() {
    if (!this.hypno.value) return nothing;
    const { hypno } = hypnoKeys.from(this.keys.value);
    if (hypno === GameHypnoType.off) return nothing;
    const phrases = HypnoPhrases[hypno];
    if (phrases.length <= 0) return nothing;
    const index = this.hypno.value.currentPhrase ?? 0;
    const { gender, body } = playerKeys.from(this.player.value);
    const phrase = translateWith(
      { gender, body, hypno },
      phrases[index % phrases.length]
    );
    if (!phrase) return nothing;
    const intensity = this.intensity.value?.intensity ?? 0;
    const delay = 3000 - intensity * 100 * 29;
    return keyed(
      `${phrase}-${index}`,
      html`<div class="phrase" style="--fade: ${delay * 0.5}ms">${phrase}</div>`
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [HYPNO_TAG]: ClassicHypnoElement;
  }
}
