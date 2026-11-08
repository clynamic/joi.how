import { LitElement, html, css, nothing } from 'lit';
import '../../../elements/JoiImage';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import Assets, { AssetKey, AssetsState } from '../../assets';
import Intensity, { IntensityState } from '../intensity';
import { imageKeys, getImageSwitchDuration } from '../randomImages';
import Image, { displayKeys, ImageState } from './index';
import { base } from '../../../elements/base';
import { defineElement } from '../../../engine/defineElement';

export const BACKDROP_TAG = 'how-joi-classic-backdrop';

export class ClassicBackdropElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        position: absolute;
        isolation: isolate;
        overflow: hidden;
        height: 100%;
        width: 100%;
      }
      @keyframes pulse {
        0% {
          transform: scale(4.8);
        }
        50% {
          transform: scale(5.6);
        }
        100% {
          transform: scale(4.8);
        }
      }

      .foreground,
      .background {
        position: absolute;
        inset: 0;
        pointer-events: none;
        user-select: none;
      }

      .foreground {
        z-index: -1;
      }
      .background {
        z-index: -2;
        inset: auto;
        left: 37.5%;
        top: 37.5%;
        width: 25%;
        height: 25%;
        display: flex;
        justify-items: center;
        align-items: center;
        filter: blur(8px);
        animation: pulse var(--pulse) ease-in-out infinite;
      }
    `,
  ];

  private image = Frames.watch<ImageState>(this, Image.paths);
  private intensity = Frames.watch<IntensityState>(this, Intensity.paths);
  private assets = Frames.watch<AssetsState>(this, Assets.paths);
  private display = Frames.watch<Document>(this, displayKeys.path);
  private switching = Frames.watch<Document>(this, imageKeys.path);

  private lanes: (AssetKey | null)[] = [null, null];

  private assign(current: AssetKey, next: AssetKey | undefined) {
    const lanes = [...this.lanes];
    if (!lanes.includes(current)) {
      const free = lanes.findIndex(key => key !== next);
      lanes[free === -1 ? 0 : free] = current;
    }
    if (next && next !== current && !lanes.includes(next)) {
      lanes[lanes.indexOf(current) === 0 ? 1 : 0] = next;
    }
    this.lanes = lanes;
    return lanes;
  }

  private layer(key: AssetKey | null, current: AssetKey, pulse: number) {
    const urls = key ? (this.assets.value?.inUse?.[key]?.urls ?? {}) : {};
    const kind =
      key && this.assets.value?.library?.[key]?.record?.kind === 'video'
        ? 'video'
        : 'image';
    const opacity = key === current ? 1 : key ? 0.001 : 0;
    return html`
      <div class="background" style="--pulse: ${pulse}ms; opacity: ${opacity}">
        ${key
          ? html`<joi-image
              .thumb=${urls.thumbnail ?? ''}
              .preview=${urls.preview ?? ''}
              kind=${kind}
              object-fit="cover"
            ></joi-image>`
          : nothing}
      </div>
    `;
  }

  render() {
    const current = this.image.value?.currentImage;
    if (!current) return nothing;
    const next = this.image.value?.nextImages?.[0];
    const { videoSound } = displayKeys.from(this.display.value);
    const switchDuration = getImageSwitchDuration(
      imageKeys.from(this.switching.value),
      this.intensity.value?.intensity ?? 0
    );
    const pulse = Math.round(switchDuration / 500) * 500;
    const urls = this.assets.value?.inUse?.[current]?.urls ?? {};
    const kind =
      this.assets.value?.library?.[current]?.record?.kind === 'video'
        ? 'video'
        : 'image';
    const lanes = this.assign(current, next);
    return html`
      ${this.layer(lanes[0], current, pulse)}
      ${this.layer(lanes[1], current, pulse)}
      <div class="foreground">
        <joi-image
          .thumb=${urls.thumbnail ?? ''}
          .preview=${urls.preview ?? ''}
          .full=${urls.full ?? ''}
          kind=${kind}
          ?playable=${kind === 'video'}
          ?loud=${videoSound}
          random-start
          object-fit="contain"
        ></joi-image>
      </div>
    `;
  }
}

defineElement(BACKDROP_TAG, ClassicBackdropElement);

declare global {
  interface HTMLElementTagNameMap {
    [BACKDROP_TAG]: ClassicBackdropElement;
  }
}
