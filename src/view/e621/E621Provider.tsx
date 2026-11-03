import { createLocalStorageProvider } from '../common/utils/localstorage';
import { E621Credentials, E621SortOrder } from '../../game/e621/client';

export interface E621Settings {
  search: string;
  limit: number;
  order: E621SortOrder;
  minScore?: number;
  credentials?: E621Credentials;
  blacklist?: string[];
  enableBlacklist: boolean;
}

const e621StorageKey = 'e621';

export const {
  Provider: E621Provider,
  useProvider: useE621Settings,
  useProviderSelector: useE621Setting,
} = createLocalStorageProvider<E621Settings>({
  key: e621StorageKey,
  defaultData: {
    search: '',
    limit: 75,
    order: E621SortOrder.Random,
    enableBlacklist: false,
  },
});
