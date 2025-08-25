import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import React from 'react';
import { createComponent, type EventName } from '@lit/react';

export type JoiToggleTileType = 'none' | 'check' | 'radio';

@customElement('joi-toggle-tile')
export class JoiToggleTileElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      --wa-content-spacing: 0;
    }

    .action {
      display: block;
      width: 100%;
      cursor: pointer;

      background: var(--wa-color-neutral-fill-quiet);

      border: none;
      border-radius: var(--wa-border-radius-m);

      margin: var(--wa-space-2xs) 0;
      padding: var(--wa-space-xs) var(--wa-space-s);

      transition:
        opacity var(--wa-transition-normal),
        background var(--wa-transition-normal);
    }

    .action:hover {
      background: var(--wa-color-brand);
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--wa-space-3xs);
    }

    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--wa-space-xs);
    }

    .trailing {
      display: flex;
      align-items: center;
      justify-content: center;

      font-size: calc(var(--wa-font-size-l) * 1.1);
      padding: var(--wa-space-2xs);
    }

    ::slotted(.subtitle) {
      margin: 0;
      font-size: var(--wa-font-size-m);
      font-weight: var(--wa-font-weight-semibold);
    }

    ::slotted(.caption) {
      margin: 0;
      font-size: var(--wa-font-size-s);
      color: var(--wa-color-text-quiet);
    }
  `;

  @property({ type: Boolean, reflect: true })
  accessor value = true;

  @property({ type: String, reflect: true })
  accessor type: JoiToggleTileType = 'none';

  @property({ type: Boolean, reflect: true })
  accessor disabled = false;

  private onClick = () => {
    if (this.disabled) return;
    if (this.type === 'check') this.value = !this.value;
    if (this.type === 'radio') this.value = true;
    this.dispatchEvent(
      new CustomEvent('change', { detail: { value: this.value } })
    );
  };

  updated() {
    const actionButton = this.shadowRoot?.querySelector(
      '.action'
    ) as HTMLElement;
    if (actionButton) {
      actionButton.style.opacity = this.value ? '1' : '0.3';
    }
  }

  renderTrailing() {
    if (this.type === 'check') {
      return html`
        <slot name="trailing">
          <wa-icon
            variant="regular"
            name=${this.value ? 'square-check' : 'square'}
          ></wa-icon>
        </slot>
      `;
    }
    if (this.type === 'radio') {
      return html`
        <slot name="trailing">
          <wa-icon
            variant="regular"
            name=${this.value ? 'circle-dot' : 'circle'}
          ></wa-icon>
        </slot>
      `;
    }
    return html`<slot name="trailing"></slot>`;
  }

  render() {
    return html`
      <button class="action" type="button" @click=${this.onClick}>
        <div class="row">
          <div class="content"><slot></slot></div>
          <div class="trailing">${this.renderTrailing()}</div>
        </div>
      </button>
    `;
  }
}

export const JoiToggleTile = createComponent({
  tagName: 'joi-toggle-tile',
  elementClass: JoiToggleTileElement,
  react: React,
  events: {
    onChange: 'change' as EventName<CustomEvent<{ value: boolean }>>,
  },
});
