import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
import '@awesome.me/webawesome/dist/components/tab/tab.js';
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../../../elements/JoiFields';
import '../../e621/search';
import '../../local/import';
import { base } from '../../../elements/base';

export const SOURCES_TAG = 'how-joi-classic-sources';

const tabs = {
  e621: 'e621',
  local: 'Device',
} as const;

type Tab = keyof typeof tabs;

@customElement(SOURCES_TAG)
export class ClassicSourcesElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }

      joi-fields::part(legend) {
        padding: 0;
      }

      wa-tab::part(base) {
        padding: var(--wa-space-2xs) var(--wa-space-xs);
      }

      wa-tab {
        background: var(--section-background);
        transition: background var(--wa-transition-normal);
      }

      wa-tab[active] {
        background: var(--legend-background);
        color: var(--wa-color-foreground);
      }
    `,
  ];

  @state() private accessor active: Tab = 'e621';

  render() {
    return html`
      <joi-fields>
        <div slot="legend">
          <wa-tab-group
            @wa-tab-show=${(e: CustomEvent<{ name: string }>) =>
              (this.active = e.detail.name as Tab)}
          >
            ${Object.entries(tabs).map(
              ([name, label]) =>
                html`<wa-tab panel=${name} ?active=${this.active === name}
                  >${label}</wa-tab
                >`
            )}
          </wa-tab-group>
        </div>
        ${this.active === 'e621'
          ? html`<how-joi-e621-search></how-joi-e621-search>`
          : html`<how-joi-local-import></how-joi-local-import>`}
      </joi-fields>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [SOURCES_TAG]: ClassicSourcesElement;
  }
}
