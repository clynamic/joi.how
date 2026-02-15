import { lensFromPath } from '../Lens';
import { Composer } from '../Composer';
import { pluginPaths } from '../plugins/Plugins';
import { GameFrame, Pipe } from '../State';
import { CamelCase, toCamel } from '../../utils/case';

export type GameEvent<T = any> = { type: string } & (unknown extends T
  ? { payload?: T }
  : { payload: T });

export type EventState = {
  pending: GameEvent[];
  current: GameEvent[];
};

const PLUGIN_NAMESPACE = 'core.events';

const events = pluginPaths<EventState>(PLUGIN_NAMESPACE);
const eventStateLens = lensFromPath<GameFrame, EventState>(events.state);
const pendingLens = lensFromPath<GameFrame, GameEvent[]>(events.state.pending);

export class Events {
  static getKey(namespace: string, key: string): string {
    return `${namespace}/${key}`;
  }

  static getKeys<K extends string>(
    namespace: string,
    ...keys: K[]
  ): { [P in K as CamelCase<P>]: string } {
    return Object.fromEntries(
      keys.map(k => [toCamel(k), Events.getKey(namespace, k)])
    ) as { [P in K as CamelCase<P>]: string };
  }

  static parseKey(key: string): { namespace: string; key: string } {
    const index = key.indexOf('/');
    if (index === -1) {
      throw new Error(`Invalid event key: "${key}"`);
    }
    return {
      namespace: key.slice(0, index),
      key: key.slice(index + 1),
    };
  }

  static dispatch<T>(event: GameEvent<T>): Pipe {
    return pendingLens.over(pending => [...pending, event], []);
  }

  static handle<T = any>(
    type: string,
    fn: (event: GameEvent<T>) => Pipe
  ): Pipe {
    const { namespace, key } = Events.parseKey(type);
    const isWildcard = key === '*';
    const prefix = namespace + '/';

    return (obj: GameFrame): GameFrame => {
      const state = eventStateLens.get(obj);
      const current = state?.current;
      if (!current || current.length === 0) return obj;
      let result: GameFrame = obj;
      for (const event of current) {
        if (isWildcard ? event.type.startsWith(prefix) : event.type === type) {
          result = fn(event as GameEvent<T>)(result);
        }
      }
      return result;
    };
  }

  /**
   * Moves events from pending to current.
   * This prevents events from being processed during the same frame they are created.
   * This is important because pipes later in the pipeline may add new events.
   */
  static pipe: Pipe = Composer.over(events.state, ({ pending = [] }) => ({
    pending: [],
    current: pending,
  }));
}
