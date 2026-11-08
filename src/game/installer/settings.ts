import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/switch/switch.js';
import { LitElement, html, css, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import '../../elements/JoiDivider';
import '../../elements/JoiFields';
import '../../elements/JoiText';
import { Frames } from '../../engine/Frames';
import PluginInstaller, {
  InstallFailure,
} from '../../engine/plugins/PluginInstaller';
import type { PluginMeta } from '../../engine/plugins/Plugins';
import { sdk } from '../../engine/sdk';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const INSTALLER_SETTINGS_TAG = 'how-joi-installer-settings';

type InstallerSlice = {
  installed?: string[];
  disabled?: string[];
  meta?: Record<string, PluginMeta>;
  failed?: InstallFailure[];
};

export class InstallerSettingsElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;

        flex-direction: column;
      }

      input {
        display: none;
      }

      wa-details {
        --show-duration: 100ms;
        --hide-duration: 100ms;
        margin: var(--wa-space-2xs) 0;
      }

      wa-details::part(header) {
        background: var(--wa-color-neutral-fill-quiet);
        transition:
          opacity var(--wa-transition-normal),
          background var(--wa-transition-normal);
        border-radius: var(--wa-border-radius-m);
        padding: var(--wa-space-s) var(--wa-space-s);
      }

      wa-details.off::part(header) {
        opacity: 0.3;
      }

      wa-details::part(header):hover {
        background: var(--wa-color-brand);
      }

      wa-details::part(content) {
        padding: var(--wa-space-xs) var(--wa-space-s);
      }

      .actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: var(--wa-space-xs);
      }

      .failure {
        display: flex;
        align-items: center;
        gap: var(--wa-space-xs);
        margin: 0 0 var(--wa-space-xs);
        color: var(--wa-color-danger-60);
        font-size: 0.9rem;
      }

      .caption {
        margin: 0;
      }
    `,
  ];

  private installer = Frames.watch<InstallerSlice>(this, [
    'core',
    'plugin_installer',
  ]);

  @query('input') private accessor file!: HTMLInputElement;

  private async onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const code = await file.text();
    sdk.inject(PluginInstaller.install(code));
    input.value = '';
  }

  render() {
    const {
      installed = [],
      disabled = [],
      meta = {},
      failed = [],
    } = this.installer.value ?? {};
    return html`
      <joi-fields label="Plugins">
        <joi-description>Add mods to your game.</joi-description>
        <input type="file" accept=".js" @change=${this.onFile} />
        <wa-button variant="neutral" @click=${() => this.file.click()}>
          <wa-icon name="upload" slot="start"></wa-icon>
          <span>Load plugin</span>
        </wa-button>
        <joi-space size="small"></joi-space>
        ${failed.map(
          failure => html`
            <p class="failure">
              <wa-icon name="triangle-exclamation"></wa-icon>
              <span>
                ${failure.id ? `${failure.id}: ` : ''}${failure.message}
              </span>
            </p>
          `
        )}
        ${repeat(
          installed,
          id => id,
          id => {
            const m = meta[id];
            const enabled = !disabled.includes(id);
            return html`
              <wa-details
                appearance="plain"
                class=${classMap({ off: !enabled })}
              >
                <h6 slot="summary">
                  ${m?.name ?? id}${m?.version ? ` v${m.version}` : ''}
                </h6>
                <p class="caption">${id}</p>
                ${m?.description
                  ? html`<p class="caption">${m.description}</p>`
                  : nothing}
                ${m?.author
                  ? html`<p class="caption">by ${m.author}</p>`
                  : nothing}
                <div class="actions">
                  <wa-switch
                    .checked=${enabled}
                    @change=${(e: Event) =>
                      sdk.inject(
                        (e.currentTarget as any).checked
                          ? PluginInstaller.enable(id)
                          : PluginInstaller.disable(id)
                      )}
                  ></wa-switch>
                  <wa-button
                    size="small"
                    variant="neutral"
                    @click=${() => sdk.inject(PluginInstaller.remove(id))}
                  >
                    <wa-icon name="trash"></wa-icon>
                  </wa-button>
                </div>
              </wa-details>
            `;
          }
        )}
        ${installed.length === 0
          ? html`<p class="caption">No plugins installed</p>`
          : nothing}
      </joi-fields>
    `;
  }
}

defineElement(INSTALLER_SETTINGS_TAG, InstallerSettingsElement);

declare global {
  interface HTMLElementTagNameMap {
    [INSTALLER_SETTINGS_TAG]: InstallerSettingsElement;
  }
}
