import { Pipe } from '../engine/State';
import { Events, GameEvent, Scheduler } from '../engine/pipes';
import { sdk } from '../engine/sdk';
import Messages from './plugins/messages';

type MessageInput = Omit<Parameters<typeof Messages.send>[0], 'id'>;
type MessagePrompt = NonNullable<MessageInput['prompts']>[number];

export type SequenceScope = {
  messageId: string;
  on<T = any>(handler: (event: GameEvent<T>) => Pipe): Pipe;
  on<T = any>(name: string, handler: (event: GameEvent<T>) => Pipe): Pipe;
  message(msg: MessageInput): Pipe;
  after<T = any>(duration: number, target: string, payload?: T): Pipe;
  prompt<T = any>(title: string, target: string, payload?: T): MessagePrompt;
  start<T = any>(payload?: T): Pipe;
  cancel(): Pipe;
  dispatch<T = any>(target: string, payload?: T): Pipe;
  eventKey(target: string): string;
  scheduleKey(target: string): string;
};

export class Sequence {
  static for(namespace: string, name: string): SequenceScope {
    const rootKey = Events.getKey(namespace, name);
    const nodeKey = (n: string) => Events.getKey(namespace, `${name}.${n}`);
    const schedKey = (n: string) => Scheduler.getKey(namespace, `${name}.${n}`);

    return {
      messageId: name,
      on(nameOrHandler: any, handler?: any) {
        if (typeof nameOrHandler === 'function')
          return Events.handle(rootKey, nameOrHandler);
        return Events.handle(nodeKey(nameOrHandler), handler);
      },
      message: msg => Messages.send({ ...msg, id: name }),
      after: (duration, target, payload) =>
        Scheduler.schedule({
          id: schedKey(target),
          duration,
          event: {
            type: nodeKey(target),
            ...(payload !== undefined && { payload }),
          },
        }),
      prompt: (title, target, payload) => ({
        title,
        event: {
          type: nodeKey(target),
          ...(payload !== undefined && { payload }),
        },
      }),
      start: payload =>
        Events.dispatch({
          type: rootKey,
          ...(payload !== undefined && { payload }),
        } as GameEvent),
      cancel: () => Scheduler.cancelByPrefix(Scheduler.getKey(namespace, name)),
      dispatch: (target, payload) =>
        Events.dispatch({
          type: target ? nodeKey(target) : rootKey,
          ...(payload !== undefined && { payload }),
        } as GameEvent),
      eventKey: nodeKey,
      scheduleKey: schedKey,
    };
  }
}

declare module '../engine/sdk' {
  interface SDK {
    Sequence: typeof Sequence;
  }
}

sdk.Sequence = Sequence;
