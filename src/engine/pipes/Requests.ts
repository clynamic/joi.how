import { Composer } from '../Composer';
import { typedPath } from '../Lens';
import { GameFrame, Pipe } from '../State';
import { Effects, Inject, Performer } from './Effects';
import { Events } from './Events';

const PLUGIN_NAMESPACE = 'core.requests';

export type RequestId = string;

export type PendingRequest = { type: string; payload: unknown };

type RequestsState = {
  next: number;
  pending: Record<RequestId, PendingRequest>;
};

export type Done<R> = { type: string; id: RequestId; result: R };
export type Failed = { type: string; id: RequestId; reason: string };

const requests = typedPath<RequestsState>([PLUGIN_NAMESPACE]);

const eventType = Events.getKeys(PLUGIN_NAMESPACE, 'done', 'failed');

const without =
  (id: RequestId) =>
  (
    pending: Record<RequestId, PendingRequest>
  ): Record<RequestId, PendingRequest> =>
    Object.fromEntries(Object.entries(pending).filter(([key]) => key !== id));

export type RequestDefinition<P, R> = {
  type: string;
  start: (payload: P) => Pipe;
  perform: (
    fn: (payload: P, inject: Inject, id: RequestId) => Promise<R>
  ) => Performer<unknown>;
  onDone: (fn: (result: R, id: RequestId) => Pipe) => Pipe;
  onFailed: (fn: (reason: string, id: RequestId) => Pipe) => Pipe;
};

export class Requests {
  static define<P = void, R = void>(
    namespace: string,
    key: string
  ): RequestDefinition<P, R> {
    const effect = Effects.define<{ id: RequestId; payload: P }>(
      namespace,
      key
    );
    const type = effect.type;

    return {
      type,

      start: payload =>
        Composer.do<GameFrame>(({ get, set, pipe }) => {
          const state = get(requests) ?? { next: 0, pending: {} };
          const id = `${type}#${state.next}`;
          set(requests, {
            next: state.next + 1,
            pending: { ...state.pending, [id]: { type, payload } },
          });
          pipe(effect.emit({ id, payload }));
        }),

      perform: fn =>
        effect.perform(({ id, payload }, inject: Inject) => {
          fn(payload, inject, id).then(
            result =>
              inject(
                Events.dispatch<Done<R>>({
                  type: eventType.done,
                  payload: { type, id, result },
                })
              ),
            error =>
              inject(
                Events.dispatch<Failed>({
                  type: eventType.failed,
                  payload: { type, id, reason: String(error) },
                })
              )
          );
        }),

      onDone: fn =>
        Events.handle<Done<R>>(eventType.done, event =>
          event.payload.type === type
            ? fn(event.payload.result, event.payload.id)
            : frame => frame
        ),

      onFailed: fn =>
        Events.handle<Failed>(eventType.failed, event =>
          event.payload.type === type
            ? fn(event.payload.reason, event.payload.id)
            : frame => frame
        ),
    };
  }

  static pending(frame: GameFrame, type?: string): RequestId[] {
    const pending = Composer.get(requests.pending)(frame) ?? {};
    return Object.keys(pending).filter(
      id => type === undefined || pending[id].type === type
    );
  }

  static pipe: Pipe = Composer.pipe(
    Events.handle<Done<unknown>>(eventType.done, event =>
      Composer.over(requests.pending, without(event.payload.id), {})
    ),
    Events.handle<Failed>(eventType.failed, event =>
      Composer.over(requests.pending, without(event.payload.id), {})
    )
  );
}
