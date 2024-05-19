import { createContext, useContext } from 'use-context-selector';
import { useEffect, useState } from 'react';

export interface PornSocketService {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  listenTo(id: number): Promise<void>;

  muteFrom(id: number): Promise<void>;
}

export const PornSocketContext = createContext<PornSocketService | null>(null);

export function usePornSocketService(enableDefault = false) {
  const service = useContext(PornSocketContext);

  const [enabled, setEnabled] = useState<boolean>(enableDefault);
  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    if (enabled) {
      service?.connect()
        .then(() => setReady(true))
        .catch(() => setReady(false));}

    return () => {
      service?.disconnect().then(() => setReady(false));
    };
  }, [service, enabled]);

  return {
    enabled: Boolean(service) && enabled,
    setEnabled,
    ready,
    service,
  };
}