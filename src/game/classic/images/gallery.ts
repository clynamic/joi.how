import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/card/card.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/popup/popup.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';
import '../../../elements/JoiDivider';
import '../../../elements/JoiFields';
import '../../../elements/JoiImage';
import '../../../elements/JoiToggleTile';
import { Frames } from '../../../engine/Frames';
import { Document } from '../../../engine/plugins/Documents';
import { sdk } from '../../../engine/sdk';
import Assets, {
  AssetEntry,
  AssetKey,
  AssetRecord,
  AssetsState,
} from '../../assets';
import { displayKeys } from '../image';
import ClassicImages from './index';
import { base } from '../../../elements/base';
import { BackController } from '../../../elements/back';
import { defineElement } from '../../../engine/defineElement';

export const GALLERY_TAG = 'how-joi-classic-gallery';
export const GALLERY_TILE_TAG = 'how-joi-classic-gallery-tile';

export type GalleryImage = {
  key: AssetKey;
  record: AssetRecord;
  urls: AssetEntry['urls'];
};

const kindOf = (image: GalleryImage) =>
  image.record.kind === 'video' ? 'video' : 'image';

export class GalleryTileElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
        position: relative;
      }

      .thumb {
        position: relative;
        height: 40px;
        width: 40px;
        cursor: pointer;
        transition:
          transform 0.2s,
          box-shadow 0.2s;
      }

      :host(:hover) .thumb {
        z-index: 10;
        transform: scale(1.4);
        box-shadow: 0 0 10px rgba(40, 50, 60, 0.75);
      }

      .preview {
        width: 300px;
        z-index: 20;
        pointer-events: none;
      }

      .check {
        position: absolute;
        inset: 0;
        z-index: 15;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--overlay-background);
        color: var(--overlay-color);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      .check.selecting {
        pointer-events: auto;
        cursor: pointer;
      }

      .check.selected {
        opacity: 1;
      }
    `,
  ];

  @property({ attribute: false }) accessor image!: GalleryImage;
  @property({ type: Boolean }) accessor selected = false;
  @property({ type: Boolean }) accessor selecting = false;

  @state() private accessor hovered = false;

  render() {
    const image = this.image;
    return html`
      <wa-popup
        placement="bottom-end"
        distance="-10"
        flip
        shift
        shift-padding="8"
        ?active=${this.hovered}
      >
        <div
          slot="anchor"
          class="thumb"
          @pointerenter=${() => (this.hovered = true)}
          @pointerleave=${() => (this.hovered = false)}
          @click=${() => {
            this.hovered = false;
            this.dispatchEvent(new Event('open'));
          }}
        >
          <joi-image
            .thumb=${image.urls.thumbnail ?? ''}
            kind=${kindOf(image)}
            object-fit="cover"
            alt="thumbnail #${image.key}"
          ></joi-image>
        </div>
        ${this.hovered
          ? html`<div class="preview">
              <joi-image
                .thumb=${image.urls.thumbnail ?? ''}
                .preview=${image.urls.preview ?? image.urls.thumbnail ?? ''}
                kind=${kindOf(image)}
                ?playable=${image.record.kind === 'video'}
                object-fit="contain"
                ratio="1"
                alt="preview #${image.key}"
              ></joi-image>
            </div>`
          : nothing}
      </wa-popup>
      <div
        class=${classMap({
          check: true,
          selecting: this.selecting,
          selected: this.selected,
        })}
        @click=${() => this.dispatchEvent(new Event('toggle'))}
      >
        <wa-icon name="check"></wa-icon>
      </div>
    `;
  }
}

export class ClassicGalleryElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: block;
        grid-column: 1 / -1;
      }

      .head {
        display: flex;
        justify-content: space-between;
      }

      .head > div {
        display: flex;
        gap: var(--wa-space-xs);
      }

      .grid {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
      }

      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 16px 0;
      }

      wa-dialog::part(dialog) {
        background-color: transparent;
      }

      wa-dialog::part(body) {
        padding: var(--wa-space-2xs);
      }

      .stack {
        display: flex;
        flex-direction: column;
        gap: var(--wa-space-xs);
      }

      wa-dialog .view {
        height: 400px;
      }

      wa-card {
        background-color: var(--wa-color-surface-raised);
      }

      wa-card::part(body) {
        padding: var(--wa-space-2xs);
      }
    `,
  ];

  private selection = Frames.watch<Document>(this, ClassicImages.keys.path);
  private assets = Frames.watch<AssetsState>(this, Assets.paths);
  private display = Frames.watch<Document>(this, displayKeys.path);

  @state() private accessor selected: AssetKey[] = [];
  @state() private accessor clicked: AssetKey | null = null;
  @state() private accessor viewing = false;
  private back = new BackController(this, () => (this.viewing = false));

  private images(): GalleryImage[] {
    const { images } = ClassicImages.keys.from(this.selection.value);
    const assets = this.assets.value;
    return (images as AssetKey[]).flatMap(key => {
      const entry = assets?.library?.[key];
      if (!entry) return [];
      return [
        { key, record: entry.record, urls: assets?.inUse?.[key]?.urls ?? {} },
      ];
    });
  }

  private open(image: GalleryImage) {
    this.clicked = image.key;
    this.viewing = true;
    this.back.open();
    sdk.inject(
      Assets.load(image.key, image.record.kind === 'video' ? 'full' : 'preview')
    );
    sdk.inject(Assets.load(image.key, 'full'));
  }

  private toggle(key: AssetKey) {
    this.selected = this.selected.includes(key)
      ? this.selected.filter(k => k !== key)
      : [...this.selected, key];
  }

  private browse(image: GalleryImage) {
    const source = image.record.meta?.source as string | undefined;
    const url = source?.startsWith('local://')
      ? (image.urls.full ?? '')
      : (source ?? image.urls.full ?? '');
    if (url) window.open(url, '_blank');
  }

  render() {
    const images = this.images();
    const { videoSound } = displayKeys.from(this.display.value);
    const selected = this.selected.filter(key =>
      images.some(i => i.key === key)
    );
    const allIcon =
      images.length > 0 && selected.length === images.length
        ? 'check-square'
        : selected.length > 0
          ? 'minus-square'
          : 'square';
    const clicked = images.find(image => image.key === this.clicked) ?? null;
    return html`
      <joi-fields label="Images">
        <div class="head">
          <p>You have loaded ${images.length} images</p>
          <div>
            <wa-tooltip for="delete-selected-images"
              >Delete selected images</wa-tooltip
            >
            <wa-button
              id="delete-selected-images"
              size="small"
              ?disabled=${selected.length === 0}
              @click=${() => {
                sdk.inject(ClassicImages.remove(selected));
                this.selected = [];
              }}
            >
              <wa-icon name="trash"></wa-icon>
            </wa-button>
            <wa-tooltip for="select-deselect-all-images">
              ${selected.length > 0
                ? 'Deselect all images'
                : 'Select all images'}
            </wa-tooltip>
            <wa-button
              id="select-deselect-all-images"
              size="small"
              ?disabled=${images.length === 0}
              @click=${() =>
                (this.selected =
                  selected.length > 0 ? [] : images.map(image => image.key))}
            >
              <wa-icon name=${allIcon} variant="regular"></wa-icon>
            </wa-button>
          </div>
        </div>
        <joi-space size="small"></joi-space>
        ${images.length === 0
          ? html`<div class="empty">
              <h2><wa-icon name="image"></wa-icon></h2>
              <p>No images have been added</p>
            </div>`
          : html`<div class="grid">
              ${repeat(
                images,
                image => image.key,
                image => html`
                  <how-joi-classic-gallery-tile
                    .image=${image}
                    ?selected=${selected.includes(image.key)}
                    ?selecting=${selected.length > 0}
                    @open=${() => this.open(image)}
                    @toggle=${() => this.toggle(image.key)}
                  ></how-joi-classic-gallery-tile>
                `
              )}
            </div>`}
      </joi-fields>
      <wa-dialog
        light-dismiss
        .open=${this.viewing && !!clicked}
        @wa-after-hide=${() => {
          this.clicked = null;
          this.back.close();
        }}
      >
        ${clicked
          ? html`
              <div class="stack">
                <joi-image
                  class="view"
                  .thumb=${clicked.urls.thumbnail ?? ''}
                  .preview=${clicked.urls.preview ?? ''}
                  .full=${clicked.urls.full ?? ''}
                  kind=${kindOf(clicked)}
                  ?playable=${clicked.record.kind === 'video'}
                  ?loud=${videoSound}
                  object-fit="contain"
                  alt="file #${clicked.key}"
                ></joi-image>
                <wa-card appearance="filled">
                  <joi-toggle-tile @change=${() => this.browse(clicked)}>
                    <h6 class="subtitle">Browse</h6>
                    <p class="caption">Open source in new tab</p>
                    <wa-icon
                      slot="trailing"
                      name="arrow-up-right-from-square"
                    ></wa-icon>
                  </joi-toggle-tile>
                  <joi-toggle-tile
                    @change=${() => {
                      this.selected = [...this.selected, clicked.key];
                      this.clicked = null;
                    }}
                  >
                    <h6 class="subtitle">Select</h6>
                    <p class="caption">Start multi-select here</p>
                    <span slot="trailing"
                      ><wa-icon name="square-check"></wa-icon
                    ></span>
                  </joi-toggle-tile>
                  <joi-toggle-tile
                    @change=${() => {
                      sdk.inject(ClassicImages.remove([clicked.key]));
                      this.clicked = null;
                    }}
                  >
                    <h6 class="subtitle">Delete</h6>
                    <p class="caption">Remove from library</p>
                    <span slot="trailing"
                      ><wa-icon name="trash"></wa-icon
                    ></span>
                  </joi-toggle-tile>
                </wa-card>
              </div>
            `
          : nothing}
      </wa-dialog>
    `;
  }
}

defineElement(GALLERY_TILE_TAG, GalleryTileElement);
defineElement(GALLERY_TAG, ClassicGalleryElement);

declare global {
  interface HTMLElementTagNameMap {
    [GALLERY_TAG]: ClassicGalleryElement;
    [GALLERY_TILE_TAG]: GalleryTileElement;
  }
}
