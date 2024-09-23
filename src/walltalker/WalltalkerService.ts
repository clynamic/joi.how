import axios, { AxiosInstance } from 'axios';
import { isEqual } from 'lodash';

export interface WalltalkerLink {
  id: number;
  expires: string;
  terms: string;
  blacklist: string;
  post_url: string;
  post_thumbnail_url: string;
  post_description: string;
  created_at: string;
  updated_at: string;
  response_type?: string;
  response_text?: string;
  username: string;
  online: boolean;
}

export interface WalltalkerUser {
  username: string;
  id: number;
  set_count: number;
  online: boolean;
  authenticated: boolean;
  links: WalltalkerLink[];
}

export class WalltalkerService {
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'https://walltaker.joi.how/api',
    });
  }

  private axiosInstance: AxiosInstance;
  private socket: WebSocket | null = null;

  private subscriptions: number[] = [];

  get subcriptions() {
    return this.subscriptions.slice();
  }

  connect(): Promise<void> {
    return new Promise((res, rej) => {
      if (this.socket) {
        switch (this.socket.readyState) {
          case this.socket.OPEN:
            res();
            return;
          case this.socket.CONNECTING:
            this.socket.addEventListener('open', () => res());
            this.socket.addEventListener('error', () => rej());
            return;
          case this.socket.CLOSING:
          case this.socket.CLOSED:
            this.socket = null;
            return this.connect();
        }
      }

      const socket = new WebSocket('wss://walltaker.joi.how/cable');
      this.socket = socket;

      this.socket.addEventListener('message', this.onAnyMessage.bind(this));

      this.socket.addEventListener('open', () => res());
      this.socket.addEventListener('error', () => rej());
    });
  }

  disconnect(): Promise<void> {
    return new Promise(res => {
      if (this.socket) {
        this.socket.addEventListener('close', () => res());
        this.socket.close();
      }
      this.socket = null;
      this.subscriptions = [];
    });
  }

  listenTo(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const MAX_RETRIES = 4;
      let tries = 0;
      const eventName = 'confirm_subscription';

      if (!this.socket) {
        reject('No socket connected.');
        return;
      }

      const handler = (message: MessageEvent<string>) => {
        if (!this.socket) return;

        const content = JSON.parse(message.data);
        if (content.identifier) {
          content.identifier = JSON.parse(content.identifier);
        }

        console.log(content);

        if (
          content.type === eventName &&
          isEqual(content.identifier, this.channelIdentifierFor(id))
        ) {
          console.log('Handshake confirmed for Link#' + id);
          this.socket.removeEventListener('message', handler);
          this.subscriptions.push(id);
          resolve();
          return;
        }

        if (++tries > MAX_RETRIES) {
          this.socket.removeEventListener('message', handler);
          reject(
            `Max retries hit when waiting for handshake confirmation for Link#${id}.`
          );
        }
      };

      this.socket.addEventListener('message', handler);

      const channelId = this.channelIdentifierFor(id);
      const message = { command: 'subscribe', identifier: channelId };

      this.socket.send(JSON.stringify(message));
    });
  }

  muteFrom(id: number): Promise<void> {
    return new Promise((res, rej) => {
      if (!this.socket) {
        rej('No socket connected.');
        return;
      }

      const channelId = JSON.stringify(this.channelIdentifierFor(id));
      const message = { command: 'unsubscribe', identifier: channelId };

      this.socket.send(JSON.stringify(message));
      this.subscriptions = this.subscriptions.filter(sub => sub !== id);
      res();
    });
  }

  private channelIdentifierFor(id: number) {
    return { channel: 'LinkChannel', id };
  }

  async getLink(id: number) {
    return this.axiosInstance
      .get<WalltalkerLink>(`/links/${id}.json`)
      .then(res => res.data);
  }

  async getLinksFromUsername(username: string) {
    return this.axiosInstance
      .get<WalltalkerUser>(`/users/${username}.json`)
      .then(res => res.data.links);
  }

  private onAnyMessage(message: MessageEvent<string>) {
    const content = JSON.parse(message.data);
    if (content.message?.success === true && content.message?.post_url) {
      this.listeners.forEach(listener =>
        listener(content.message as WalltalkerLink)
      );
    }
  }

  private listeners: ((link: WalltalkerLink) => void)[] = [];

  addLinkListener(callback: (link: WalltalkerLink) => void) {
    this.listeners.push(callback);
  }

  removeLinkListener(callback: (link: WalltalkerLink) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
}
