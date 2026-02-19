import { Composer } from '../Composer';
import { Pipe } from '../State';
import { pluginPaths, PluginId } from '../plugins/Plugins';
import { sdk } from '../sdk';

declare module '../sdk' {
  interface SDK {
    Errors: typeof Errors;
  }
}

export type ErrorEntry = {
  phase: string;
  message: string;
  stack?: string;
  timestamp: number;
  count: number;
};

export type ErrorsContext = {
  plugins: Record<PluginId, Record<string, ErrorEntry>>;
};

const PLUGIN_NAMESPACE = 'core.errors';

const errors = pluginPaths<ErrorsContext>(PLUGIN_NAMESPACE);

export class Errors {
  static withCatch(id: PluginId, phase: string, pluginPipe: Pipe): Pipe {
    return Composer.do(({ get, set, pipe }) => {
      try {
        pipe(pluginPipe);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        const timestamp = Date.now();

        const entryPath = errors.plugins[id][phase];
        const existing = get(entryPath);
        const count = existing ? existing.count + 1 : 1;
        const isNew = !existing || existing.message !== message;

        set(entryPath, { phase, message, stack, timestamp, count });

        if (sdk.debug && isNew) {
          console.error(`[errors] ${id} ${phase}:`, err);
        }
      }
    });
  }

  static pipe: Pipe = frame => frame;

  static get paths() {
    return errors;
  }
}

sdk.Errors = Errors;
