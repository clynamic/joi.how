import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import { LitElement, html, css, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { chunk } from 'lodash';
import '../../elements/JoiDivider';
import '../../elements/JoiText';
import { sdk } from '../../engine/sdk';
import ClassicImages from '../classic/images';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import { LocalImageRequest } from './images';
import Local from './index';
import { base } from '../../elements/base';

export const LOCAL_IMPORT_TAG = 'how-joi-local-import';

const CHUNK = 30;

@customElement(LOCAL_IMPORT_TAG)
export class LocalImportElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: grid;
        grid-template-columns: 1fr;
      }

      input {
        display: none;
      }

      wa-button {
        justify-self: center;
      }

      .progress {
        display: flex;
        flex-direction: column;
        gap: var(--wa-space-xs);
      }
    `,
  ];

  @query('input') private accessor picker!: HTMLInputElement;

  @state() private accessor loading = false;
  @state() private accessor total: number | null = null;
  @state() private accessor progress = 0;

  private async select(event: Event) {
    const fileList = (event.currentTarget as HTMLInputElement).files;
    if (!fileList) return;
    try {
      this.loading = true;
      this.total = 0;
      this.progress = 0;
      const files = await discoverImageFiles(fileList);
      this.total = files.length;
      for (const part of chunk(files, CHUNK)) {
        const requests = part.map<LocalImageRequest>(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          this.progress += 1;
          return {
            blob: file,
            type: imageTypeFromExtension(extension!),
            name: file.name,
          };
        });
        const items = await Local.import(requests);
        sdk.inject(
          ClassicImages.add(
            items.map(item => ({ source: Local.source, ...item }))
          )
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.loading = false;
      this.total = null;
      this.progress = 0;
      this.picker.value = '';
    }
  }

  render() {
    return html`
      <joi-description>Add images from your device</joi-description>
      <joi-space size="medium"></joi-space>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        @change=${this.select}
      />
      <wa-button ?disabled=${this.loading} @click=${() => this.picker.click()}>
        <span>Select Files</span>
        <wa-icon slot="end" name="upload"></wa-icon>
      </wa-button>
      <joi-space size="small"></joi-space>
      ${this.total !== null
        ? html`
            <div class="progress">
              <span>${this.progress} / ${this.total} files processed</span>
              <wa-progress-bar
                value=${this.total ? (this.progress / this.total) * 100 : 0}
              ></wa-progress-bar>
            </div>
          `
        : nothing}
      <joi-space size="small"></joi-space>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    [LOCAL_IMPORT_TAG]: LocalImportElement;
  }
}
