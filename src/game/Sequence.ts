import { Pipe } from '../engine/State';
import {
  Events,
  getEventKey,
  Messages,
  Scheduler,
  getScheduleKey,
} from '../engine/pipes';

type EventHandler = Parameters<typeof Events.handle>[1];
type MessageInput = Omit<Parameters<typeof Messages.send>[0], 'id'>;
type MessagePrompt = NonNullable<MessageInput['prompts']>[number];

export type SequenceScope = {
  messageId: string;
  on(handler: EventHandler): Pipe;
  on(name: string, handler: EventHandler): Pipe;
  message(msg: MessageInput): Pipe;
  after(duration: number, target: string, payload?: any): Pipe;
  prompt(title: string, target: string, payload?: any): MessagePrompt;
  start(payload?: any): Pipe;
  cancel(): Pipe;
  dispatch(target: string, payload?: any): Pipe;
  eventKey(target: string): string;
  scheduleKey(target: string): string;
};

export class Sequence {
  static for(namespace: string, name: string): SequenceScope {
    const rootKey = getEventKey(namespace, name);
    const nodeKey = (n: string) => getEventKey(namespace, `${name}.${n}`);
    const schedKey = (n: string) => getScheduleKey(namespace, `${name}.${n}`);

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
        }),
      cancel: () => Scheduler.cancelByPrefix(getScheduleKey(namespace, name)),
      dispatch: (target, payload) =>
        Events.dispatch({
          type: target ? nodeKey(target) : rootKey,
          ...(payload !== undefined && { payload }),
        }),
      eventKey: nodeKey,
      scheduleKey: schedKey,
    };
  }
}
