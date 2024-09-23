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
      this.socket.addEventListener('message', this.pingEcho);

      this.socket.addEventListener('open', () => res());
      this.socket.addEventListener('error', () => rej());
    });
  }

  private pingEcho = (message: MessageEvent<string>) => {
    if (!this.socket) return;
    const content = JSON.parse(message.data);
    if (content.type === 'ping') {
      this.socket.send(JSON.stringify({ type: 'pong' }));
    }
  };

  private consumeUntil = async (
    predicate: (message: MessageEvent<string>) => boolean,
    timeout: number = 5000
  ) => {
    return new Promise<MessageEvent<string>>((res, rej) => {
      if (!this.socket) {
        rej('No socket connected.');
        return;
      }

      const timer = setTimeout(() => {
        this.socket?.removeEventListener('message', handler);
        rej('Timeout reached.');
      }, timeout);

      const handler = (message: MessageEvent<string>) => {
        if (predicate(message)) {
          this.socket?.removeEventListener('message', handler);
          clearTimeout(timer);
          res(message);
        }
      };

      this.socket.addEventListener('message', handler);
      this.socket.addEventListener('close', () => rej('Socket closed.'));
    });
  };

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
      const eventName = 'confirm_subscription';

      if (!this.socket) {
        reject('No socket connected.');
        return;
      }

      const channelId = this.channelIdentifierFor(id);
      const message = {
        command: 'subscribe',
        identifier: JSON.stringify(channelId),
      };

      this.socket.send(JSON.stringify(message));

      resolve(
        this.consumeUntil((message: MessageEvent<string>) => {
          const content = JSON.parse(message.data);
          if (content.identifier) {
            content.identifier = JSON.parse(content.identifier);
          }

          return (
            content.type === eventName &&
            isEqual(content.identifier, this.channelIdentifierFor(id))
          );
        })
          .then(() => {
            console.log('Handshake confirmed for Link#' + id);
            this.subscriptions.push(id);
          })
          .catch(error => {
            reject(`Failed to confirm handshake for Link#${id}: ${error}`);
          })
      );
    });
  }

  muteFrom(id: number): Promise<void> {
    return new Promise((res, rej) => {
      if (!this.socket) {
        rej('No socket connected.');
        return;
      }

      const channelId = this.channelIdentifierFor(id);
      const message = {
        command: 'unsubscribe',
        identifier: JSON.stringify(channelId),
      };

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
    console.log(content);
  }

  private listeners: ((link: WalltalkerLink) => void)[] = [];

  addLinkListener(callback: (link: WalltalkerLink) => void) {
    this.listeners.push(callback);
  }

  removeLinkListener(callback: (link: WalltalkerLink) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }
}
