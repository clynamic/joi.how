import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/option/option.js';
import '@awesome.me/webawesome/dist/components/select/select.js';
import '@awesome.me/webawesome/dist/components/slider/slider.js';
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { collapse } from '../../elements/collapse';
import '../../elements/JoiDivider';
import '../../elements/JoiMeasure';
import '../../elements/JoiRow';
import '../../elements/JoiText';
import '../../elements/JoiToggleTile';
import { Frames } from '../../engine/Frames';
import { PendingRequest } from '../../engine/pipes/Requests';
import { Document } from '../../engine/plugins/Documents';
import { sdk } from '../../engine/sdk';
import ClassicImages from '../classic/images';
import {
  E621Credentials,
  E621Service,
  E621SortOrder,
  e621SortOrderLabels,
} from './client';
import { e621Keys } from './index';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const E621_SEARCH_TAG = 'how-joi-e621-search';
export const E621_CREDENTIALS_TAG = 'how-joi-e621-credentials';

const SEARCH_TYPE = 'how.joi.e621/search';

const grid = css`
  .grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    column-gap: 1rem;
  }

  .grid > :not(joi-row) {
    grid-column: 1 / -1;
  }

  wa-input,
  wa-select,
  wa-slider,
  wa-textarea {
    width: 100%;
  }
`;

export class E621CredentialsElement extends LitElement {
  static styles = [
    ...base,
    grid,
    css`
      :host {
        display: block;
      }

      .actions {
        display: flex;
        justify-content: flex-end;
      }
    `,
  ];

  @property({ attribute: false }) accessor service!: E621Service;
  @property({ type: Boolean }) accessor disabled = false;

  @state() private accessor username = '';
  @state() private accessor apiKey = '';
  @state() private accessor loading = false;

  private async save() {
    this.loading = true;
    try {
      const credentials: E621Credentials = {
        username: this.username,
        apiKey: this.apiKey,
      };
      const valid = await this.service.testCredentials(credentials);
      if (valid) {
        this.dispatchEvent(
          new CustomEvent('saved', { detail: credentials, bubbles: true })
        );
      }
    } finally {
      this.loading = false;
    }
  }

  render() {
    const locked = this.loading || this.disabled;
    return html`
      <div class="grid">
        <joi-space size="small"></joi-space>
        <joi-row>
          <label for="username">Username</label>
          <wa-input
            id="username"
            .value=${this.username}
            placeholder="e.g. eggplant_enjoyer"
            autocomplete="username"
            ?disabled=${locked}
            @input=${(e: Event) =>
              (this.username = (e.currentTarget as any).value || '')}
          ></wa-input>
        </joi-row>
        <joi-space size="small"></joi-space>
        <joi-row>
          <label for="api-key">API Key</label>
          <wa-input
            id="api-key"
            .value=${this.apiKey}
            placeholder="pws gimmi ur keys :3"
            type="password"
            autocomplete="current-password"
            ?disabled=${locked}
            @input=${(e: Event) =>
              (this.apiKey = (e.currentTarget as any).value || '')}
          >
            <p slot="hint">
              Access your API key
              <a
                href="https://e621.net/users/you/api_key"
                target="_blank"
                rel="noreferrer"
                >here</a
              >.
            </p>
          </wa-input>
        </joi-row>
        <joi-space size="medium"></joi-space>
        <div class="actions">
          <wa-button
            size="small"
            ?disabled=${locked || !(this.username && this.apiKey)}
            ?loading=${this.loading}
            @click=${this.save}
          >
            <span>Save</span>
            <wa-icon slot="end" name="save"></wa-icon>
          </wa-button>
        </div>
        <joi-space size="small"></joi-space>
      </div>
    `;
  }
}

export class E621SearchElement extends LitElement {
  static styles = [
    ...base,
    grid,
    collapse,
    css`
      :host {
        display: block;
      }

      joi-toggle-tile {
        --tile-inactive-opacity: 1;
      }

      .blacklist-head {
        display: flex;
        justify-content: space-between;
      }

      .blacklist-head > div {
        display: flex;
        gap: var(--wa-space-xs);
      }

      .search {
        justify-self: center;
      }

      .any {
        white-space: nowrap;
        font-family: 'Courier New', Courier, monospace;
        font-weight: var(--wa-font-weight-bold);
      }

      wa-textarea {
        resize: vertical;
      }
    `,
  ];

  private keys = Frames.watch<Document>(this, e621Keys.path);
  private pending = Frames.watch<Record<string, PendingRequest>>(this, [
    'core.requests',
    'pending',
  ]);

  @state() private accessor addingCredentials = false;
  @state() private accessor blacklistDraft: string | null = null;

  private service = new E621Service();

  private set<K extends keyof typeof e621Keys.defaults>(
    key: K,
    value: (typeof e621Keys.defaults)[K]
  ) {
    sdk.inject(e621Keys.set(key, value));
  }

  private search() {
    const {
      search,
      limit,
      order,
      minScore,
      credentials,
      blacklist,
      enableBlacklist,
    } = e621Keys.from(this.keys.value);
    sdk.inject(
      ClassicImages.searchE621({
        tags: search,
        limit,
        order,
        minScore: minScore === -1 ? undefined : minScore,
        credentials: credentials ?? undefined,
        blacklist: enableBlacklist ? blacklist : undefined,
      })
    );
  }

  private async fetchBlacklist(credentials: E621Credentials) {
    try {
      this.set('blacklist', await this.service.getBlacklist(credentials));
    } catch (error) {
      console.error(error);
    }
  }

  private onSaved(event: CustomEvent<E621Credentials>) {
    const credentials = event.detail;
    this.set('credentials', credentials);
    this.addingCredentials = false;
    const { blacklist } = e621Keys.from(this.keys.value);
    if (!blacklist.length) this.fetchBlacklist(credentials);
  }

  render() {
    const {
      search,
      limit,
      order,
      minScore,
      credentials,
      blacklist,
      enableBlacklist,
    } = e621Keys.from(this.keys.value);
    const loading = Object.values(this.pending.value ?? {}).some(
      request => request.type === SEARCH_TYPE
    );
    return html`
      <div class="grid">
        <joi-description>Add images from e621</joi-description>
        <joi-row>
          <label for="tags">Tags</label>
          <wa-input
            id="tags"
            .value=${search}
            placeholder="e.g. dragon huge_penis"
            ?disabled=${loading}
            @input=${(e: Event) =>
              this.set('search', (e.currentTarget as any).value || '')}
            @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.search()}
          ></wa-input>
        </joi-row>
        <joi-space size="medium"></joi-space>
        <joi-row>
          <label for="order">Order</label>
          <wa-select
            id="order"
            value=${order}
            ?disabled=${loading}
            @input=${(e: Event) =>
              this.set(
                'order',
                (e.currentTarget as any).value as E621SortOrder
              )}
          >
            ${Object.values(E621SortOrder).map(
              value =>
                html`<wa-option value=${value}
                  >${e621SortOrderLabels[value]}</wa-option
                >`
            )}
          </wa-select>
        </joi-row>
        <joi-space size="medium"></joi-space>
        <joi-row>
          <label for="count">Count</label>
          <wa-slider
            id="count"
            min="1"
            max="200"
            step="1"
            .value=${limit}
            @input=${(e: Event) =>
              this.set('limit', Number((e.currentTarget as any).value))}
          ></wa-slider>
          <joi-measure .value=${limit} chars="3" unit="posts"></joi-measure>
        </joi-row>
        <joi-space size="medium"></joi-space>
        <joi-row>
          <label for="score">Score</label>
          <wa-slider
            id="score"
            min="-1"
            max="50"
            step="1"
            .value=${minScore}
            @input=${(e: Event) =>
              this.set('minScore', Number((e.currentTarget as any).value))}
          ></wa-slider>
          ${minScore === -1
            ? html`<span class="any">any</span>`
            : html`<joi-measure
                .value=${minScore}
                chars="3"
                unit="votes"
              ></joi-measure>`}
        </joi-row>
        <joi-space size="medium"></joi-space>
        <joi-toggle-tile
          type="check"
          .value=${!!credentials || this.addingCredentials}
          @click=${() => {
            if (credentials) this.set('credentials', null);
            else this.addingCredentials = !this.addingCredentials;
          }}
        >
          <h6 class="subtitle">Credentials</h6>
          <p class="caption">
            Use your e621 account to access restricted content
          </p>
        </joi-toggle-tile>
        <div class="collapse" ?open=${this.addingCredentials}>
          <div>
            <how-joi-e621-credentials
              .service=${this.service}
              ?disabled=${loading}
              @saved=${this.onSaved}
            ></how-joi-e621-credentials>
          </div>
        </div>
        <div class="collapse" ?open=${!!credentials}>
          <div>
            <joi-info>
              You are logged in as <strong>${credentials?.username}</strong>
              <wa-icon name="user"></wa-icon>
            </joi-info>
          </div>
        </div>
        <joi-toggle-tile
          type="check"
          .value=${enableBlacklist}
          @click=${() => this.set('enableBlacklist', !enableBlacklist)}
        >
          <h6 class="subtitle">Enable blacklist</h6>
          <p class="caption">Hide posts with specific tags</p>
        </joi-toggle-tile>
        <div class="collapse" ?open=${enableBlacklist}>
          <div>
            <wa-tooltip for="blacklist-info">View blacklist help</wa-tooltip>
            <wa-tooltip for="blacklist-refresh">
              Download blacklist from e621
            </wa-tooltip>
            <div class="blacklist-head">
              <joi-info>Blacklist</joi-info>
              <div>
                <wa-button
                  id="blacklist-info"
                  href="https://e621.net/help/blacklist"
                  target="_blank"
                  size="small"
                >
                  <wa-icon name="info-circle"></wa-icon>
                </wa-button>
                <wa-button
                  id="blacklist-refresh"
                  size="small"
                  ?disabled=${!credentials}
                  @click=${() =>
                    credentials && this.fetchBlacklist(credentials)}
                >
                  <wa-icon name="sync"></wa-icon>
                </wa-button>
              </div>
            </div>
            <wa-textarea
              .value=${this.blacklistDraft ?? blacklist.join('\n')}
              placeholder="Enter tags..."
              @focus=${() => (this.blacklistDraft = blacklist.join('\n'))}
              @blur=${() => (this.blacklistDraft = null)}
              @input=${(e: Event) => {
                const text = (e.currentTarget as any).value || '';
                this.blacklistDraft = text;
                this.set(
                  'blacklist',
                  text
                    .split('\n')
                    .map((tag: string) => tag.trim())
                    .filter((tag: string) => tag)
                );
              }}
            ></wa-textarea>
          </div>
        </div>
        <joi-space size="medium"></joi-space>
        <wa-button class="search" ?loading=${loading} @click=${this.search}>
          <p>Search & Add</p>
          <wa-icon slot="end" name="search"></wa-icon>
        </wa-button>
        <joi-space size="medium"></joi-space>
      </div>
    `;
  }
}

defineElement(E621_CREDENTIALS_TAG, E621CredentialsElement);
defineElement(E621_SEARCH_TAG, E621SearchElement);

declare global {
  interface HTMLElementTagNameMap {
    [E621_SEARCH_TAG]: E621SearchElement;
    [E621_CREDENTIALS_TAG]: E621CredentialsElement;
  }
}
