import { createLocalStorageProvider } from '../utils';

export interface E621Settings {
  search: string;
  limit: number;
  order: E621SortOrder;
  minScore?: number;
  credentials?: E621Credentials;
  blacklist?: string[];
  enableBlacklist: boolean;
}

export interface E621Credentials {
  username: string;
  apiKey: string;
}

export enum E621SortOrder {
  Id = 'id',
  Random = 'random',
  Favourites = 'favourites',
  Comments = 'comments',
  Score = 'score',
}

export const e621SortOrderLabels: Record<E621SortOrder, string> = {
  [E621SortOrder.Id]: 'ID',
  [E621SortOrder.Random]: 'Random',
  [E621SortOrder.Favourites]: 'Favourites',
  [E621SortOrder.Comments]: 'Comments',
  [E621SortOrder.Score]: 'Score',
};

export const e621SortOrderTags: Record<E621SortOrder, string> = {
  [E621SortOrder.Id]: 'order:id_desc',
  [E621SortOrder.Random]: 'order:random',
  [E621SortOrder.Favourites]: 'order:favcount',
  [E621SortOrder.Comments]: 'order:comment_count',
  [E621SortOrder.Score]: 'order:score',
};

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
    order: E621SortOrder.Id,
    enableBlacklist: true,
  },
});
