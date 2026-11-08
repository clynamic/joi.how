import '@awesome.me/webawesome/dist/components/button/button.js';
import '@awesome.me/webawesome/dist/components/details/details.js';
import '@awesome.me/webawesome/dist/components/dialog/dialog.js';
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/spinner/spinner.js';
import '@awesome.me/webawesome/dist/components/tooltip/tooltip.js';
import { LitElement, html, css, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { version } from '../../../package.json';
import '../../elements/JoiDivider';
import '../../elements/JoiSection';
import { Frames } from '../../engine/Frames';
import { Document } from '../../engine/plugins/Documents';
import { sdk } from '../../engine/sdk';
import Scene, { SceneState } from '../scene';
import Home from './index';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const HOME_TAG = 'how-joi-home';

const links = [
  {
    id: 'donations',
    url: 'https://ko-fi.com/binaryfloof',
    text: 'Support us on Ko-fi',
    icon: 'dollar',
    family: undefined,
  },
  {
    id: 'discord',
    url: 'https://discord.clynamic.net',
    text: 'Join our Discord',
    icon: 'discord',
    family: 'brands',
  },
  {
    id: 'github',
    url: 'https://github.com/clynamic/joi.how',
    text: 'View on GitHub',
    icon: 'github',
    family: 'brands',
  },
];

export class HomeElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0;
        padding: 16px;
        box-sizing: border-box;
      }

      :host > * {
        max-width: 920px;
        width: 100%;
      }

      .title {
        background: transparent;
        color: var(--text-color);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
      }

      .title h1 {
        font-size: 3rem;
        margin-bottom: 32px;
      }

      .title img {
        padding: 40px 0 30px 0;
        width: 200px;
        aspect-ratio: 1;
      }

      .title abbr {
        text-decoration: none;
        background: rgba(70, 87, 105, 0.4);
        padding: 5px 20px;
        margin: 0 10px;
      }

      .age::part(dialog) {
        box-shadow: none;
      }

      .age::part(dialog)::backdrop {
        backdrop-filter: blur(20px);
      }

      .age::part(close-button) {
        display: none;
      }

      .age .actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: var(--wa-space-s);
      }

      .settings {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
        gap: var(--wa-space-m);
      }

      .version {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .version .links {
        display: flex;
        align-items: center;
        gap: var(--wa-space-xs);
      }

      .notes::part(header) {
        transition: background var(--wa-transition-normal);
        border-radius: var(--wa-form-control-border-radius);
      }

      .notes::part(header):hover,
      .notes[open]::part(header) {
        background: var(--button-background);
      }

      .notes::part(content) {
        background: var(--button-background);
        border-radius: var(--wa-form-control-border-radius);
        margin-top: var(--wa-space-s);
      }

      .changelog {
        padding: 20px;
        max-height: 500px;
        overflow-y: auto;
      }

      .changelog h1 {
        font-size: 1.75rem;
      }

      .changelog h2 {
        font-size: 1.5rem;
      }

      .changelog h3 {
        font-size: 1.25rem;
      }

      .changelog h4 {
        font-size: 1rem;
      }

      .changelog h5 {
        font-size: 0.875rem;
      }

      .changelog h6 {
        font-size: 0.75rem;
      }

      .changelog p {
        line-height: 1.5;
      }

      .changelog wa-spinner {
        font-size: 2.4rem;
      }

      .rules h3 {
        padding: 4px 16px;
      }

      .start {
        background: transparent;
      }

      @media (max-width: 600px) {
        :host {
          padding: 6px;
        }

        .title h1 {
          font-size: 2.2rem;
          margin-bottom: 12px;
        }

        .title img {
          padding: 16px 0 12px 0;
          width: 140px;
        }

        .settings {
          gap: var(--wa-space-xs);
        }
      }
    `,
  ];

  private scene = Frames.watch<SceneState>(this, Scene.paths);
  private keys = Frames.watch<Document>(this, Home.keys.path);

  @state() private accessor changelog: string | null = null;

  connectedCallback() {
    super.connectedCallback();
    if (this.changelog !== null) return;
    fetch('/CHANGELOG.md')
      .then(response => response.text())
      .then(async text => (this.changelog = await marked(text)))
      .catch(() => (this.changelog = '<p>Release notes are unavailable.</p>'));
  }

  private confirmAge() {
    sdk.inject(Home.keys.set('ageCheckConfirm', true));
  }

  render() {
    const scene = this.scene.value?.current;
    const ready = typeof scene === 'string' && scene !== 'boot';
    const { ageCheckConfirm } = Home.keys.from(this.keys.value);
    return html`
      <joi-section class="title">
        <img src="/logo.svg" alt="JOI.how" />
        <h1><abbr title="Jack Off Instructions">JOI</abbr><sup>.how</sup></h1>
      </joi-section>
      ${ready
        ? html`
            <wa-dialog
              class="age"
              label="Age Confirmation"
              .open=${!ageCheckConfirm}
              @wa-hide=${(e: Event) => ageCheckConfirm || e.preventDefault()}
            >
              <p>
                This app is meant for adults only. By clicking "I am an adult",
                you confirm that you are at least 18 years old.
              </p>
              <joi-space size="large"></joi-space>
              <div class="actions">
                <wa-button href="https://www.google.com" variant="danger">
                  <span>I am not an adult</span>
                  <wa-icon slot="end" name="ban"></wa-icon>
                </wa-button>
                <wa-button @click=${this.confirmAge}>
                  <span>I am an adult</span>
                  <wa-icon slot="end" name="check"></wa-icon>
                </wa-button>
              </div>
            </wa-dialog>
            <joi-section>
              <p>
                Select your settings, and this app will guide ya' thru a
                jack-off session. You can adjust most of the aspects of the
                game, as well as select some porn to help with "motivation".
                It's all pulled from <a href="https://e621.net">e621.net</a>.
                <strong
                  >You are responsible for what you choose to look at.</strong
                >
              </p>
            </joi-section>
            <joi-section class="settings">
              <how-joi-classic-pace-settings></how-joi-classic-pace-settings>
              <how-joi-classic-duration-settings></how-joi-classic-duration-settings>
              <how-joi-player-settings></how-joi-player-settings>
              <how-joi-dice-settings></how-joi-dice-settings>
              <how-joi-classic-hypno-settings></how-joi-classic-hypno-settings>
              <how-joi-dice-climax-settings></how-joi-dice-climax-settings>
              <how-joi-classic-board-settings></how-joi-classic-board-settings>
              <how-joi-classic-sources></how-joi-classic-sources>
              <how-joi-classic-gallery></how-joi-classic-gallery>
              <how-joi-toy-settings></how-joi-toy-settings>
              <how-joi-installer-settings></how-joi-installer-settings>
            </joi-section>
            <joi-section class="version">
              <h6>Version ${version}</h6>
              <div class="links">
                ${links.map(
                  link => html`
                    <wa-tooltip for="app-link-${link.id}"
                      >${link.text}</wa-tooltip
                    >
                    <wa-button
                      id="app-link-${link.id}"
                      href=${link.url}
                      target="_blank"
                      size="small"
                    >
                      <wa-icon
                        name=${link.icon}
                        family=${link.family ?? nothing}
                        style="font-size: var(--wa-font-size-l)"
                      ></wa-icon>
                    </wa-button>
                  `
                )}
              </div>
            </joi-section>
            <joi-section>
              <wa-details class="notes" appearance="plain">
                <h4 slot="summary">Release Notes</h4>
                <div class="changelog">
                  ${this.changelog
                    ? unsafeHTML(this.changelog)
                    : html`<wa-spinner></wa-spinner>`}
                </div>
              </wa-details>
            </joi-section>
            <joi-section class="rules">
              <h3>Rules</h3>
              <ul>
                <li>Only focus on the porn on screen</li>
                <li>Keep your strokes to the pace of the center circle</li>
                <li>Watch out for events announced on the right side</li>
              </ul>
            </joi-section>
            <joi-section class="start">
              <how-joi-classic-start></how-joi-classic-start>
            </joi-section>
          `
        : nothing}
    `;
  }
}

defineElement(HOME_TAG, HomeElement);

declare global {
  interface HTMLElementTagNameMap {
    [HOME_TAG]: HomeElement;
  }
}
