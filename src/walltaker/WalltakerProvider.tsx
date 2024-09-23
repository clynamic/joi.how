/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createLocalStorageProvider, StateAndSetter } from '../utils';
import { WalltakerLink, WalltakerService } from './WalltakerService';
import { uniqBy } from 'lodash';
import { useImages } from '../settings';
import { ImageServiceType, ImageType } from '../types';

export interface WalltakerSettings {
  enabled?: boolean;
  username?: string;
  ids?: number[];
}

const walltakerStorageKey = 'walltaker';

const {
  Provider: WalltakerSettingsProvider,
  useProvider: useWalltakerSettings,
} = createLocalStorageProvider<WalltakerSettings>({
  key: walltakerStorageKey,
  defaultData: {},
});

const WalltakerServiceProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const settingsRef = useWalltakerSettings();
  const service = useMemo(() => new WalltakerService(), []);
  const [, setImages] = useImages();

  const [settings] = settingsRef;

  const [data, setData] = useState<WalltakerData>({});

  const onLink = useCallback(
    (link: WalltakerLink) => {
      setData(prev => ({
        ...prev,
        links: uniqBy([link, ...(prev.links ?? [])], 'id'),
      }));
      setImages(prev =>
        uniqBy(
          [
            {
              thumbnail: link.post_thumbnail_url,
              preview: link.post_thumbnail_url,
              full: link.post_url,
              type: ImageType.image,
              source: link.post_url,
              service: ImageServiceType.e621,
              id: link.post_url,
            },
            ...prev,
          ],
          'id'
        )
      );
    },
    [setImages]
  );

  useEffect(() => {
    if (settings.enabled) {
      service
        .connect()
        .then(() => {
          setData(prev => ({ ...prev, connected: true }));
          service.addLinkListener(onLink);
        })
        .catch(() => setData({ connected: false }));
    }

    return () => {
      service.disconnect().then(() => {
        setData(prev => ({ ...prev, connected: false }));
        service.removeLinkListener(onLink);
      });
    };
  }, [onLink, service, settings.enabled]);

  useEffect(() => {
    if (data.connected) {
      for (const id of settings.ids ?? []) {
        service.listenTo(id);
      }
      // TODO: add past history?
    }
  }, [data.connected, service, settings.enabled, settings.ids]);

  return (
    <WalltakerContext.Provider value={{ settings: settingsRef, service, data }}>
      {children}
    </WalltakerContext.Provider>
  );
};

export interface WalltakerData {
  connected?: boolean;
  links?: WalltakerLink[];
}

export interface WalltakerContext {
  settings: StateAndSetter<WalltakerSettings>;
  service: WalltakerService;
  data: WalltakerData;
}

const WalltakerContext = createContext<WalltakerContext | null>(null);

export const WalltakerProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <WalltakerSettingsProvider>
      <WalltakerServiceProvider>{children}</WalltakerServiceProvider>
    </WalltakerSettingsProvider>
  );
};

export const useWalltaker = (): WalltakerContext => {
  const context = useContext(WalltakerContext);

  if (!context) {
    throw new Error('useWalltaker must be used within a WalltakerProvider');
  }

  return context;
};
