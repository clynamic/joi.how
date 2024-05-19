import { PropsWithChildren, useRef } from 'react';
import { PornSocketContext, PornSocketService } from './porn-socket-service.tsx';

class WalltakerSocketService implements PornSocketService {
  private socket: WebSocket | null = null;

  connect(): Promise<void> {
    return new Promise((res, rej) => {
      if (this.socket) {
        switch(this.socket.readyState) {
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
            return this.connect()
        }
      }

      const socket = new WebSocket('wss://walltaker.joi.how/cable');
      this.socket = socket;

      socket.addEventListener('open', () => res());
      socket.addEventListener('error', () => rej());
    });
  }

  disconnect(): Promise<void> {
    return new Promise((res) => {
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

      this.socket.addEventListener('message', this.firstMessageHandlerFor('confirm_subscription', id, rej, res));
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

  private channelIdentifierFor(id: number) {
    return JSON.stringify({ channel: 'LinkChannel', id });
  }

  private firstMessageHandlerFor(eventName: string, id: number, rej: (message?: string) => void, res: () => void) {
    const MAX_RETRIES = 4;
    let tries = 0;

    const handler = (message: MessageEvent<string>) => {
      const content = JSON.parse(message.data);
      if (content.type === eventName && content.identifier === this.channelIdentifierFor(id)) {
        this.socket?.removeEventListener('message', handler);
        res();
        return;
      }

      if (++tries > MAX_RETRIES) {
        this.socket?.removeEventListener('message', handler);
        rej(`Max retries hit when waiting for subscription confirmation for Link#${id}.`);
      }
    };

    return handler;
  }
}

export function WalltakerSocketServiceProvider({ children }: PropsWithChildren<object>) {
  const walltakerSocketService = useRef(new WalltakerSocketService());
  return <PornSocketContext.Provider value={walltakerSocketService.current}>{children}</PornSocketContext.Provider>;
}