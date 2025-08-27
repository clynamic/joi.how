import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import React from 'react';
import { createComponent, type EventName } from '@lit/react';

@customElement('joi-image')
export class JoiImageElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
      min-height: 0;
      --joi-prog-transition: 10ms ease;
      --joi-prog-fit: cover;
      --joi-prog-radius: var(--wa-border-radius-m, 0);
      border-radius: var(--joi-prog-radius);
    }
    .layer {
      position: absolute;
      inset: 0;
      opacity: 0;
      transition: opacity var(--joi-prog-transition);
      will-change: opacity;
      contain: paint;
    }
    .layer[visible] {
      opacity: 1;
    }
    img,
    video {
      width: 100%;
      height: 100%;
      object-fit: var(--joi-prog-fit);
      display: block;
      border-radius: inherit;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
    }
  `;

  @property({ type: String }) accessor thumb = '';
  @property({ type: String }) accessor preview = '';
  @property({ type: String }) accessor full = '';
  @property({ type: Number, reflect: true }) accessor ratio:
    | number
    | undefined = undefined;
  @property({ type: String, reflect: true, attribute: 'object-fit' })
  accessor objectFit: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down' =
    'cover';
  @property({ type: Boolean, reflect: true }) accessor eager = false;

  @property({ type: String, reflect: true }) accessor kind: 'image' | 'video' =
    'image';
  @property({ type: Boolean, reflect: true }) accessor playable = false;
  @property({ type: Boolean, reflect: true }) accessor loud = false;
  @property({ type: Boolean, reflect: true, attribute: 'random-start' })
  accessor randomStart = false;
  @property({ type: String }) accessor alt = '';

  @state() accessor thumbReady = false;
  @state() accessor previewReady = false;
  @state() accessor fullReady = false;
  @state() accessor inView = false;

  private io?: IntersectionObserver;

  connectedCallback() {
    super.connectedCallback();
    this.style.setProperty('--joi-prog-fit', this.objectFit);
    if (this.ratio && Number.isFinite(this.ratio))
      this.style.aspectRatio = String(this.ratio);
    this.io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            this.inView = true;
            this.io?.disconnect();
            this.io = undefined;
          }
        }
      },
      { rootMargin: '200px' }
    );
    if (!this.eager) this.io.observe(this);
    else this.inView = true;
  }

  disconnectedCallback() {
    this.io?.disconnect();
    super.disconnectedCallback();
  }

  updated(changed: Map<string, unknown>) {
    if (
      changed.has('thumb') ||
      changed.has('preview') ||
      changed.has('full') ||
      changed.has('kind') ||
      changed.has('playable')
    ) {
      this.thumbReady = this.previewReady = this.fullReady = false;
    }
    if (changed.has('objectFit'))
      this.style.setProperty('--joi-prog-fit', this.objectFit);
    if (changed.has('ratio')) {
      if (this.ratio && Number.isFinite(this.ratio))
        this.style.aspectRatio = String(this.ratio);
      else this.style.removeProperty('aspect-ratio');
    }
    if (this.fullReady)
      this.dispatchEvent(
        new CustomEvent('ready', { detail: { stage: 'full' } })
      );
    else if (this.previewReady)
      this.dispatchEvent(
        new CustomEvent('ready', { detail: { stage: 'preview' } })
      );
    else if (this.thumbReady)
      this.dispatchEvent(
        new CustomEvent('ready', { detail: { stage: 'thumb' } })
      );
  }

  private onThumbLoad = () => {
    this.thumbReady = true;
    this.dispatchEvent(new CustomEvent('thumbready'));
  };

  private onPreviewLoad = () => {
    this.previewReady = true;
    this.dispatchEvent(new CustomEvent('previewready'));
  };

  private onFullImgLoad = () => {
    this.fullReady = true;
    this.dispatchEvent(new CustomEvent('fullready'));
  };

  private onFullVideoMeta = (e: Event) => {
    const v = e.currentTarget as HTMLVideoElement;
    if (this.randomStart && v.duration && isFinite(v.duration)) {
      v.currentTime = Math.random() * v.duration;
    }
    this.fullReady = true;
    this.dispatchEvent(new CustomEvent('fullready'));
  };

  render() {
    const wantsVideo = this.kind === 'video' && this.playable && !!this.full;
    const showThumb = !!this.thumb && !this.previewReady && !this.fullReady;
    const showPreview = !!this.preview && this.previewReady && !this.fullReady;
    const showFull = !!this.full && this.fullReady;

    return html`
      ${this.alt ? html`<span class="sr-only">${this.alt}</span>` : ''}

      <div class="layer" ?visible=${showThumb}>
        ${this.inView && this.thumb
          ? html`<img
              src=${this.thumb}
              decoding="async"
              loading="eager"
              @load=${this.onThumbLoad}
            />`
          : null}
      </div>

      ${this.preview
        ? html`<div
            class="layer"
            ?visible=${showPreview ||
            (!this.previewReady && !this.fullReady && !!this.thumbReady)}
          >
            ${this.inView
              ? html`<img
                  src=${this.preview}
                  decoding="async"
                  loading="eager"
                  @load=${this.onPreviewLoad}
                />`
              : null}
          </div>`
        : null}
      ${this.full
        ? html`<div class="layer" ?visible=${showFull}>
            ${this.inView
              ? wantsVideo
                ? html`<video
                    src=${this.full}
                    autoplay
                    loop
                    ?muted=${!this.loud}
                    playsinline
                    @loadedmetadata=${this.onFullVideoMeta}
                  ></video>`
                : html`<img
                    src=${this.full}
                    decoding="async"
                    fetchpriority="high"
                    @load=${this.onFullImgLoad}
                  />`
              : null}
          </div>`
        : null}
    `;
  }
}

export const JoiImage = createComponent({
  tagName: 'joi-image',
  elementClass: JoiImageElement,
  react: React,
  events: {
    onReady: 'ready' as EventName<
      CustomEvent<{ stage: 'thumb' | 'preview' | 'full' }>
    >,
    onThumbready: 'thumbready' as EventName<Event>,
    onPreviewready: 'previewready' as EventName<Event>,
    onFullready: 'fullready' as EventName<Event>,
  },
});
