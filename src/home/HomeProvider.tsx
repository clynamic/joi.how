import { createLocalStorageProvider } from '../utils';

export interface HomeState {
  ageCheckConfirm: boolean;
}

export const defaultHomeState = {
  ageCheckConfirm: false,
};

const homeStateKey = 'home';

export const {
  Provider: HomeProvider,
  useProvider: useHomeState,
  useProviderSelector: useHomeValue,
} = createLocalStorageProvider<HomeState>({
  key: homeStateKey,
  defaultData: defaultHomeState,
});
