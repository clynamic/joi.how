import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import React from 'react';
import { createComponent } from '@lit/react';

export type JoiStackDirection = 'row' | 'column';
export type JoiStackJustifyContent =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly';
export type JoiStackAlignItems =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'stretch'
  | 'baseline';

@customElement('joi-stack')
export class JoiStackElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
    }
  `;

  @property({ type: String, reflect: true })
  accessor direction: JoiStackDirection = 'column';

  @property({ type: Number, reflect: true })
  accessor spacing = 1;

  @property({ type: String, reflect: true, attribute: 'justify-content' })
  accessor justifyContent: JoiStackJustifyContent = 'flex-start';

  @property({ type: String, reflect: true, attribute: 'align-items' })
  accessor alignItems: JoiStackAlignItems = 'stretch';

  private getSpacingValue() {
    const spacingMap: Record<number, string> = {
      0: '0',
      1: 'var(--wa-space-xs)', // 8px
      2: 'var(--wa-space-s)', // 12px
      3: 'var(--wa-space-m)', // 16px
      4: 'var(--wa-space-l)', // 24px
      5: 'var(--wa-space-xl)', // 32px
    };
    return spacingMap[this.spacing] || spacingMap[1];
  }

  updated() {
    this.style.flexDirection = this.direction;
    this.style.justifyContent = this.justifyContent;
    this.style.alignItems = this.alignItems;

    if (this.direction === 'row') {
      this.style.gap = this.getSpacingValue();
      this.style.rowGap = '0';
    } else {
      this.style.gap = this.getSpacingValue();
      this.style.columnGap = '0';
    }
  }

  render() {
    return html`<slot></slot>`;
  }
}

export const JoiStack = createComponent({
  tagName: 'joi-stack',
  elementClass: JoiStackElement,
  react: React,
});
