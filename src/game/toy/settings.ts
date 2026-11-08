import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/input/input.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { collapse } from '../../elements/collapse';
import '../../elements/JoiDivider';
import '../../elements/JoiFields';
import '../../elements/JoiRow';
import '../../elements/JoiText';
import { Frames } from '../../engine/Frames';
import { sdk } from '../../engine/sdk';
import './deviceSettings';
import Toy, { ToyState } from './index';
import { base } from '../../elements/base';

export const TOY_SETTINGS_TAG = 'how-joi-toy-settings';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1'];

@customElement(TOY_SETTINGS_TAG)
export class ToySettingsElement extends LitElement {
  static styles = [
    ...base,
    collapse,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }

      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .head > div {
        display: flex;

        flex-direction: column;

        gap: var(--wa-space-xs);
      }

      .head joi-info {
        margin: 0;
      }

      .head p {
        margin: 0;
      }

      .server {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        column-gap: 1rem;
      }

      .server wa-input {
        width: 100%;
      }

      .server .port {
        width: 4em;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--wa-space-s);
      }

      .error {
        color: var(--wa-color-danger-fill-loud);
        text-align: center;
      }
    `,
  ];

  private toy = Frames.watch<ToyState>(this, Toy.paths);

  @state() private accessor host = '127.0.0.1';
  @state() private accessor port = '12345';
  @state() private accessor expanded = false;

  private connect(connection: string | undefined) {
    this.expanded = false;
    if (connection) {
      sdk.inject(Toy.disconnect());
      return;
    }
    const protocol = LOCAL_HOSTS.includes(this.host) ? 'ws' : 'wss';
    sdk.inject(Toy.connect(`${protocol}://${this.host}:${this.port}`));
  }

  render() {
    const { connection, error, connecting = false } = this.toy.value ?? {};
    const devices = Toy.devices();
    return html`
      <joi-fields label="Connect Devices">
        <div class="head">
          <div>
            <joi-description>
              Use compatible devices during your game
            </joi-description>
            <joi-info>
              ${connection
                ? html`<p>Connected to <strong>${connection}</strong></p>`
                : html`<p>
                    This requires you to install
                    <a
                      href="https://intiface.com/central/"
                      target="_blank"
                      rel="noreferrer"
                      >Intiface® Central</a
                    >
                  </p>`}
            </joi-info>
          </div>
          <wa-tooltip for="toy-settings-toggle">Settings</wa-tooltip>
          <wa-button
            id="toy-settings-toggle"
            ?disabled=${connecting}
            @click=${() => (this.expanded = !this.expanded)}
          >
            <wa-icon name="gear"></wa-icon>
          </wa-button>
        </div>
        <div class="collapse" ?open=${this.expanded}>
          <div>
            <joi-space size="medium"></joi-space>
            <div class="server">
              <joi-label>Server</joi-label>
              <wa-input
                placeholder="Host"
                .value=${this.host}
                ?disabled=${connecting}
                @input=${(e: Event) =>
                  (this.host = (e.currentTarget as any).value || '')}
              ></wa-input>
              <wa-input
                class="port"
                placeholder="Port"
                .value=${this.port}
                ?disabled=${connecting}
                @input=${(e: Event) =>
                  (this.port = (e.currentTarget as any).value || '')}
              ></wa-input>
            </div>
          </div>
        </div>
        <joi-space size="medium"></joi-space>
        ${connection
          ? html`
              <ul>
                ${devices.length > 0
                  ? repeat(
                      devices,
                      device => `${device.name}#${device.index}`,
                      device =>
                        html`<li>
                          <how-joi-toy-device
                            .device=${device}
                          ></how-joi-toy-device>
                        </li>`
                    )
                  : html`<li>No devices found</li>`}
              </ul>
              <joi-space size="medium"></joi-space>
            `
          : nothing}
        <wa-button
          size="small"
          ?loading=${connecting}
          @click=${() => this.connect(connection)}
        >
          <span>${connection ? 'Disconnect' : 'Connect'}</span>
          <wa-icon slot="end" name="satellite-dish"></wa-icon>
        </wa-button>
        ${error
          ? html`
              <joi-space size="small"></joi-space>
              <joi-info class="error">${error}</joi-info>
            `
          : nothing}
      </joi-fields>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [TOY_SETTINGS_TAG]: ToySettingsElement;
  }
}
