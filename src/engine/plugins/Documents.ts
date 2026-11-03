import { Composer } from '../Composer';
import { TypedPath } from '../Lens';
import { GameFrame, Pipe } from '../State';
import { Events } from '../pipes/Events';
import { Slots, SlotsState } from './Slots';

export type Document = Record<string, unknown>;

export type DocumentState = SlotsState & {
  document: Document;
  pending: Document;
  replacing?: boolean;
  loaded: boolean;
  landed?: boolean;
};

export type Keys<T extends Document> = {
  plugin: string;
  defaults: T;
  path: TypedPath<Document>;
  from: (document: Document | undefined) => T;
  get: (frame: GameFrame) => T;
  set: <K extends keyof T & string>(key: K, value: T[K]) => Pipe;
};

export const DEFAULT_SLOT = 'default';

export const isDocument = (value: unknown): value is Document =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sectionOf = (
  document: Document | undefined,
  plugin: string
): Document => {
  const section = document?.[plugin];
  return isDocument(section) ? section : {};
};

export const mergeSections = (base: Document, over: Document): Document => {
  const merged: Document = { ...base };
  for (const plugin of Object.keys(over)) {
    merged[plugin] = { ...sectionOf(base, plugin), ...sectionOf(over, plugin) };
  }
  return merged;
};

const withValue = (
  document: Document | undefined,
  plugin: string,
  key: string,
  value: unknown
): Document => ({
  ...(document ?? {}),
  [plugin]: { ...sectionOf(document, plugin), [key]: value },
});

export const Documents = {
  define(kind: string, paths: TypedPath<DocumentState>) {
    const slots = Slots.define(kind, paths, { current: DEFAULT_SLOT });
    const eventType = Events.getKeys(kind, 'missing');

    const persist = (): Pipe =>
      Composer.do(({ get, pipe }) => {
        const state = get(paths);
        if (!state) return;
        pipe(slots.write(state.current ?? DEFAULT_SLOT, state.document ?? {}));
      });

    const land = (stored: Document): Pipe =>
      Composer.do(({ get, set, pipe }) => {
        const state = get(paths);
        if (!state) return;
        const pending = state.pending ?? {};
        set(
          paths.document,
          state.replacing ? { ...pending } : mergeSections(stored, pending)
        );
        set(paths.pending, {});
        set(paths.replacing, undefined);
        set(paths.loaded, true);
        set(paths.landed, true);
        if (state.replacing || Object.keys(pending).length > 0) pipe(persist());
      });

    const write = (plugin: string, key: string, value: unknown): Pipe =>
      Composer.do(({ get, set, pipe }) => {
        const state = get(paths);
        if (!state) return;
        set(paths.document, withValue(state.document, plugin, key, value));
        if (state.loaded) {
          pipe(persist());
          return;
        }
        set(paths.pending, withValue(state.pending, plugin, key, value));
      });

    const replace = (document: Document): Pipe =>
      Composer.do(({ get, set, pipe }) => {
        const state = get(paths);
        if (!state) return;
        set(paths.document, { ...document });
        if (state.loaded) {
          pipe(persist());
          return;
        }
        set(paths.pending, { ...document });
        set(paths.replacing, true);
      });

    const read = <T>(
      frame: GameFrame,
      plugin: string,
      key: string,
      fallback: T
    ): T => {
      const section = sectionOf(Composer.get(paths.document)(frame), plugin);
      return (key in section ? section[key] : fallback) as T;
    };

    const select = (slot: string): Pipe =>
      Composer.pipe(
        Composer.set(paths.loaded, false),
        Composer.set(paths.pending, {}),
        Composer.set(paths.replacing, undefined),
        slots.select(slot)
      );

    const keys = <T extends Document>(plugin: string, defaults: T): Keys<T> => {
      const from = (document: Document | undefined): T => {
        const section = sectionOf(document, plugin);
        const values = { ...defaults };
        for (const key of Object.keys(defaults)) {
          if (key in section) {
            values[key as keyof T] = section[key] as T[keyof T];
          }
        }
        return values;
      };
      return {
        plugin,
        defaults,
        path: paths.document,
        from,
        get: frame => from(Composer.get(paths.document)(frame)),
        set: (key, value) => write(plugin, key, value),
      };
    };

    return {
      kind,
      paths,
      read,
      write,
      replace,
      keys,
      land,
      persist,
      fresh: (): Pipe => Composer.pipe(land({}), persist()),
      select,
      drop: (slot: string): Pipe =>
        Composer.do(({ get, pipe }) => {
          pipe(slots.drop(slot));
          if (get(paths.current) === slot) pipe(select(DEFAULT_SLOT));
        }),
      list: slots.list,
      find: slots.find,
      onMissing: (fn: (slot: string) => Pipe): Pipe =>
        Events.handle<{ slot: string }>(eventType.missing, event =>
          fn(event.payload.slot)
        ),
      activate: Composer.pipe(
        slots.activate,
        Composer.set(paths.document, {}),
        Composer.set(paths.pending, {}),
        Composer.set(paths.loaded, false)
      ),
      update: Composer.pipe(
        slots.update,
        slots.onRead((slot, file) =>
          Composer.do(({ get, pipe }) => {
            const state = get(paths);
            if (!state || slot !== (state.current ?? DEFAULT_SLOT)) return;
            if (file) {
              pipe(land(isDocument(file.data) ? file.data : {}));
              return;
            }
            if (state.loaded) return;
            if (state.landed) {
              pipe(land({}), persist());
              return;
            }
            pipe(
              Events.dispatch({ type: eventType.missing, payload: { slot } })
            );
          })
        )
      ),
      deactivate: slots.deactivate,
    };
  },
};

export type DocumentKind = ReturnType<typeof Documents.define>;
