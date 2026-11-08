import { LitElement, html, css, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { Frames } from '../../engine/Frames';
import { Events } from '../../engine/pipes/Events';
import { Document } from '../../engine/plugins/Documents';
import { sdk } from '../../engine/sdk';
import { hypnoKeys } from '../classic/hypno';
import { playerKeys } from '../player';
import { translateWith } from '../translate';
import Messages, { GameMessage, MessageState } from './index';
import { base } from '../../elements/base';
import { defineElement } from '../../engine/defineElement';

export const MESSAGES_TAG = 'how-joi-messages';

const LEAVE_MS = 400;

export class MessagesElement extends LitElement {
  static styles = [
    ...base,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      @keyframes enter {
        from {
          transform: translateY(-100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      @keyframes leave {
        from {
          transform: translateY(0);
          opacity: 1;
        }
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }

      .message {
        display: flex;
      }

      .message > * {
        animation: enter ${LEAVE_MS}ms cubic-bezier(0.23, 1, 0.32, 1) both;
      }

      .message.leaving > * {
        animation-name: leave;
      }

      .title,
      .description {
        background: var(--overlay-background);
        color: var(--overlay-color);
        font-size: 1rem;
        padding: 20px;
      }

      .description {
        margin: 0 0 0 1px;
      }

      button {
        background: var(--button-background);
        color: var(--button-color);
        border: none;
        height: 100%;
        font-size: 1rem;
        font-family: inherit;
        padding: 20px;
        cursor: pointer;
        transition: var(--hover-transition);
        margin-left: 1px;
      }

      button:hover {
        filter: var(--hover-filter);
      }
    `,
  ];

  private messages = Frames.watch<MessageState>(this, Messages.paths);
  private player = Frames.watch<Document>(this, playerKeys.path);
  private hypno = Frames.watch<Document>(this, hypnoKeys.path);

  @state() private accessor leaving: GameMessage[] = [];

  private shown = new Map<string, GameMessage>();

  willUpdate() {
    const current = this.messages.value?.messages ?? [];
    const ids = new Set(current.map(m => m.id));
    for (const [id, message] of this.shown) {
      if (ids.has(id)) continue;
      this.shown.delete(id);
      this.leaving = [...this.leaving, message];
      setTimeout(() => {
        this.leaving = this.leaving.filter(m => m !== message);
      }, LEAVE_MS);
    }
    for (const message of current) this.shown.set(message.id, message);
  }

  private text(value: string) {
    const { gender, body } = playerKeys.from(this.player.value);
    const { hypno } = hypnoKeys.from(this.hypno.value);
    return translateWith({ gender, body, hypno }, value);
  }

  render() {
    const current = this.messages.value?.messages;
    if (!current) return nothing;
    const leaving = new Set(this.leaving);
    const all = [...current, ...this.leaving];
    return repeat(
      all,
      message => (leaving.has(message) ? `leaving:${message.id}` : message.id),
      message => html`
        <div class="message ${leaving.has(message) ? 'leaving' : ''}">
          <div class="title">${this.text(message.title)}</div>
          ${message.description
            ? html`<p class="description">${message.description}</p>`
            : nothing}
          ${message.prompts?.map(
            prompt => html`
              <button @click=${() => sdk.inject(Events.dispatch(prompt.event))}>
                ${this.text(prompt.title)}
              </button>
            `
          )}
        </div>
      `
    );
  }
}

defineElement(MESSAGES_TAG, MessagesElement);

declare global {
  interface HTMLElementTagNameMap {
    [MESSAGES_TAG]: MessagesElement;
  }
}
