import { PropsWithChildren, useEffect, useRef } from 'react';
import {
  PornSocketContext,
  PornSocketService,
} from './porn-socket-service.tsx';
import { useImages } from '../../settings';
import { ImageServiceType, ImageType } from '../../types';

export interface LinkResponse {
  id: number;
  expires: string;
  terms: string;
  blacklist: string;
  post_url: string;
  post_thumbnail_url: string;
  post_description: string;
  created_at: string;
  updated_at: string;
  response_type?: any;
  response_text?: any;
  username: string;
  online: boolean;
}

export interface UserResponse {
  username: string;
  id: number;
  set_count: number;
  online: boolean;
  authenticated: boolean;
  links: LinkResponse[];
}

export class WalltakerSocketService implements PornSocketService {
  private socket: WebSocket | null = null;
  onChange: (link: LinkResponse) => void = () => {};

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
    });
  }

  listenTo(id: number): Promise<void> {
    return new Promise((res, rej) => {
      if (!this.socket) {
        rej('No socket connected.');
        return;
      }

      const channelId = this.channelIdentifierFor(id);
      const message = { command: 'subscribe', identifier: channelId };

      this.socket.addEventListener(
        'message',
        this.firstMessageHandlerFor('confirm_subscription', id, rej, res)
      );
      this.socket.send(JSON.stringify(message));
    });
  }

  muteFrom(id: number): Promise<void> {
    return new Promise((res, rej) => {
      if (!this.socket) {
        rej('No socket connected.');
        return;
      }

      const channelId = this.channelIdentifierFor(id);
      const message = { command: 'unsubscribe', identifier: channelId };

      this.socket.send(JSON.stringify(message));
      res();
    });
  }

  static async getLink(id: number) {
    return fetch(`https://walltaker.joi.how/api/links/${id}.json`).then(
      res => res.json() as unknown as LinkResponse
    );
  }

  static async getLinksFromUsername(username: string) {
    const result = await fetch(
      `https://walltaker.joi.how/api/users/${username}.json`
    ).then(res => res.json() as unknown as UserResponse);
    return result.links;
  }

  private onAnyMessage(message: MessageEvent<string>) {
    const content = JSON.parse(message.data);
    if (content.message?.success === true && content.message?.post_url) {
      this.onChange(content.message as unknown as LinkResponse);
    }
  }

  private channelIdentifierFor(id: number) {
    return JSON.stringify({ channel: 'LinkChannel', id });
  }

  private firstMessageHandlerFor(
    eventName: string,
    id: number,
    rej: (message?: string) => void,
    res: () => void
  ) {
    const MAX_RETRIES = 4;
    let tries = 0;

    const handler = (message: MessageEvent<string>) => {
      const content = JSON.parse(message.data);
      if (
        content.type === eventName &&
        content.identifier === this.channelIdentifierFor(id)
      ) {
        this.socket?.removeEventListener('message', handler);
        res();
        return;
      }

      if (++tries > MAX_RETRIES) {
        this.socket?.removeEventListener('message', handler);
        rej(
          `Max retries hit when waiting for subscription confirmation for Link#${id}.`
        );
      }
    };

    return handler;
  }
}

export function WalltakerSocketServiceProvider({
  children,
}: PropsWithChildren<object>) {
  const [images, setImages] = useImages();
  const walltakerSocketService = useRef(new WalltakerSocketService());

  useEffect(() => {
    walltakerSocketService.current.onChange = link => {
      if (images.find(image => image.full === link.post_url)) return;

      setImages([
        ...images,
        {
          thumbnail: link.post_thumbnail_url,
          preview: link.post_thumbnail_url,
          full: link.post_url,
          type: ImageType.image,
          source: link.post_url,
          service: ImageServiceType.e621,
          id: link.post_url,
        },
      ]);
    };
  }, [images, setImages]);

  return (
    <PornSocketContext.Provider value={walltakerSocketService.current}>
      {children}
    </PornSocketContext.Provider>
  );
}
