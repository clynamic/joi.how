import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import React from 'react';
import { createComponent, type EventName } from '@lit/react';
import { localImageService } from '../local/LocalImageService';

@customElement('joi-res')
export class JoiResElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    img,
    video,
    .placeholder {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: inherit;
      border-radius: inherit;
    }
    .placeholder {
      background: transparent;
    }
  `;

  @property({ type: String }) accessor src = '';
  @property({ type: String }) accessor alt = '';
  @property({ type: String }) accessor decoding: 'async' | 'auto' | 'sync' =
    'async';
  @property({ type: String }) accessor loading: 'eager' | 'lazy' = 'lazy';
  @property({ type: String }) accessor fetchpriority: 'high' | 'low' | 'auto' =
    'auto';
  @property({ type: String }) accessor kind: 'image' | 'video' = 'image';
  @property({ type: Boolean }) accessor autoplay = false;
  @property({ type: Boolean }) accessor loop = false;
  @property({ type: Boolean }) accessor muted = true;
  @property({ type: Boolean }) accessor playsinline = false;
  @property({ type: Boolean }) accessor randomStart = false;

  @state() accessor resolvedSrc = '';
  @state() accessor isLoading = false;
  @state() accessor hasError = false;

  updated(changed: Map<string, unknown>) {
    if (changed.has('src')) {
      this.resolveUrl();
    }
  }

  private async resolveUrl() {
    if (!this.src) {
      this.resolvedSrc = '';
      return;
    }

    this.isLoading = true;
    this.hasError = false;

    try {
      this.resolvedSrc = await localImageService.resolveUrl(this.src);
    } catch (error) {
      console.warn('Failed to resolve image URL:', error);
      this.resolvedSrc = this.src;
      this.hasError = true;
    } finally {
      this.isLoading = false;
    }
  }

  private onLoad = (e: Event) => {
    this.dispatchEvent(new CustomEvent('load', { detail: e }));
  };

  private onError = (e: Event) => {
    this.hasError = true;
    this.dispatchEvent(new CustomEvent('error', { detail: e }));
  };

  private onVideoMeta = (e: Event) => {
    const v = e.currentTarget as HTMLVideoElement;
    if (this.randomStart && v.duration && isFinite(v.duration)) {
      v.currentTime = Math.random() * v.duration;
    }
    this.dispatchEvent(new CustomEvent('loadedmetadata', { detail: e }));
  };

  render() {
    if (!this.resolvedSrc) {
      return html`<div class="placeholder"></div>`;
    }

    if (this.kind === 'video') {
      return html`
        <video
          src=${this.resolvedSrc}
          ?autoplay=${this.autoplay}
          ?loop=${this.loop}
          ?muted=${this.muted}
          .muted=${
            /* The muted property seems to suffer from a race condition, so we additionally set it via property */
            this.muted
          }
          ?playsinline=${this.playsinline}
          @loadedmetadata=${this.onVideoMeta}
          @error=${this.onError}
        ></video>
      `;
    }

    return html`
      <img
        src=${this.resolvedSrc}
        alt=${this.alt}
        decoding=${this.decoding}
        loading=${this.loading}
        fetchpriority=${this.fetchpriority}
        @load=${this.onLoad}
        @error=${this.onError}
      />
    `;
  }
}

export const JoiRes = createComponent({
  tagName: 'joi-res',
  elementClass: JoiResElement,
  react: React,
  events: {
    onLoad: 'load' as EventName<CustomEvent<Event>>,
    onError: 'error' as EventName<CustomEvent<Event>>,
    onLoadedmetadata: 'loadedmetadata' as EventName<CustomEvent<Event>>,
  },
});
