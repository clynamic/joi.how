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
import { WalltalkerLink, WalltalkerService } from './WalltalkerService';
import { uniqBy } from 'lodash';
import { useImages } from '../settings';
import { ImageServiceType, ImageType } from '../types';

export interface WalltalkerSettings {
  enabled?: boolean;
  username?: string;
  ids?: number[];
}

const walltalkerStorageKey = 'walltalker';

const {
  Provider: WalltalkerSettingsProvider,
  useProvider: useWalltalkerSettings,
} = createLocalStorageProvider<WalltalkerSettings>({
  key: walltalkerStorageKey,
  defaultData: {},
});

const WalltalkerServiceProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const settingsRef = useWalltalkerSettings();
  const service = useMemo(() => new WalltalkerService(), []);
  const [, setImages] = useImages();

  const [settings] = settingsRef;

  const [data, setData] = useState<WalltalkerData>({});

  const onLink = useCallback(
    (link: WalltalkerLink) => {
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
    <WalltalkerContext.Provider
      value={{ settings: settingsRef, service, data }}
    >
      {children}
    </WalltalkerContext.Provider>
  );
};

export interface WalltalkerData {
  connected?: boolean;
  links?: WalltalkerLink[];
}

export interface WalltalkerContext {
  settings: StateAndSetter<WalltalkerSettings>;
  service: WalltalkerService;
  data: WalltalkerData;
}

const WalltalkerContext = createContext<WalltalkerContext | null>(null);

export const WalltalkerProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  return (
    <WalltalkerSettingsProvider>
      <WalltalkerServiceProvider>{children}</WalltalkerServiceProvider>
    </WalltalkerSettingsProvider>
  );
};

export const useWalltalker = (): WalltalkerContext => {
  const context = useContext(WalltalkerContext);

  if (!context) {
    throw new Error('useWalltalker must be used within a WalltalkerProvider');
  }

  return context;
};
