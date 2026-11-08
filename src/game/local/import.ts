import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/progress-bar/progress-bar.js';
import { LitElement, html, css, nothing } from 'lit';
import { query } from 'lit/decorators.js';
import '../../elements/JoiDivider';
import '../../elements/JoiText';
import { Composer } from '../../engine/Composer';
import { Pipe } from '../../engine/State';
import { sdk } from '../../engine/sdk';
import ClassicImages from '../classic/images';
import { AssetRecord } from '../assets';
import { discoverImageFiles, imageTypeFromExtension } from './files';
import Local, { LocalState } from './index';
import { Frames } from '../../engine/Frames';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const LOCAL_IMPORT_TAG = 'how-joi-local-import';

const CHUNK = 30;

const quotaExceeded = (error: unknown) =>
  error instanceof DOMException && error.name === 'QuotaExceededError';

const progress = ({
  total,
  done,
  error,
}: NonNullable<LocalState['importing']>) =>
  error === 'quota'
    ? `Storage is full. ${done} of ${total} files were added.`
    : error
      ? `Import failed. ${done} of ${total} files were added.`
      : `${done} / ${total} files processed`;

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
    let total = 0;
    let pending: { id: string; record: AssetRecord }[] = [];
    const add = (): Pipe[] => {
      const items = pending;
      pending = [];
      return items.length
        ? [
            ClassicImages.add(
              items.map(item => ({ source: Local.source, ...item }))
            ),
          ]
        : [];
    };
    try {
      sdk.inject(Local.importing({ total, done }));
      const files = await discoverImageFiles(fileList);
      total = files.length;
      sdk.inject(Local.importing({ total, done }));
      for (const file of files) {
        const extension = file.name.split('.').pop()?.toLowerCase();
        const [item] = await Local.import([
          {
            blob: file,
            type: imageTypeFromExtension(extension!),
            name: file.name,
          },
        ]);
        pending.push(item);
        done++;
        sdk.inject(
          Composer.pipe(
            ...(pending.length >= CHUNK ? add() : []),
            Local.importing({ total, done })
          )
        );
      }
      sdk.inject(Composer.pipe(...add(), Local.importing(null)));
    } catch (error) {
      console.error(error);
      sdk.inject(
        Composer.pipe(
          ...add(),
          Local.importing({
            total,
            done,
            error: quotaExceeded(error) ? 'quota' : 'failed',
          })
        )
      );
    } finally {
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
      <wa-button
        ?disabled=${!!importing && !importing.error}
        @click=${() => this.picker.click()}
      >
        <span>Select Files</span>
        <wa-icon slot="end" name="upload"></wa-icon>
      </wa-button>
      <joi-space size="small"></joi-space>
      ${importing
        ? html`
            <div class="progress">
              <span>${progress(importing)}</span>
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
