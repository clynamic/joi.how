import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import { LitElement, html, css, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import { chunk } from 'lodash';
import '../../elements/JoiDivider';
import '../../elements/JoiText';
import { Composer } from '../../engine/Composer';
import { sdk } from '../../engine/sdk';
import ClassicImages from '../classic/images';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import { LocalImageRequest } from './images';
import Local, { LocalState } from './index';
import { Frames } from '../../engine/Frames';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const LOCAL_IMPORT_TAG = 'how-joi-local-import';

const CHUNK = 30;

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

  private local = Frames.watch<LocalState>(this, Local.paths);

  private async select(event: Event) {
    const fileList = (event.currentTarget as HTMLInputElement).files;
    if (!fileList) return;
    let done = 0;
    try {
      sdk.inject(Local.importing({ total: 0, done }));
      const files = await discoverImageFiles(fileList);
      sdk.inject(Local.importing({ total: files.length, done }));
      for (const part of chunk(files, CHUNK)) {
        const requests = part.map<LocalImageRequest>(file => {
          const extension = file.name.split('.').pop()?.toLowerCase();
          return {
            blob: file,
            type: imageTypeFromExtension(extension!),
            name: file.name,
          };
        });
        const items = await Local.import(requests);
        done += part.length;
        sdk.inject(
          Composer.pipe(
            ClassicImages.add(
              items.map(item => ({ source: Local.source, ...item }))
            ),
            Local.importing({ total: files.length, done })
          )
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      sdk.inject(Local.importing(null));
      this.picker.value = '';
    }
  }

  render() {
    const importing = this.local.value?.importing ?? null;
    return html`
      <joi-description>Add images from your device</joi-description>
      <joi-space size="medium"></joi-space>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        @change=${this.select}
      />
      <wa-button ?disabled=${!!importing} @click=${() => this.picker.click()}>
        <span>Select Files</span>
        <wa-icon slot="end" name="upload"></wa-icon>
      </wa-button>
      <joi-space size="small"></joi-space>
      ${importing
        ? html`
            <div class="progress">
              <span
                >${importing.done} / ${importing.total} files processed</span
              >
              <wa-progress-bar
                value=${importing.total
                  ? (importing.done / importing.total) * 100
                  : 0}
              ></wa-progress-bar>
            </div>
          `
        : nothing}
      <joi-space size="small"></joi-space>
    `;
  }
}

defineElement(LOCAL_IMPORT_TAG, LocalImportElement);

declare global {
  interface HTMLElementTagNameMap {
    [LOCAL_IMPORT_TAG]: LocalImportElement;
  }
}
