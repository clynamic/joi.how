import { createContext, useContext } from 'use-context-selector';
import { useEffect, useState } from 'react';

export interface PornSocketService {
  connect(): Promise<void>;

  disconnect(): Promise<void>;

  listenTo(id: number): Promise<void>;

  muteFrom(id: number): Promise<void>;
}

export const PornSocketContext = createContext<PornSocketService | null>(null);

export function usePornSocketService() {
  const service = useContext(PornSocketContext);

  const [ready, setReady] = useState<boolean>(false);

  useEffect(() => {
    service?.connect().then(() => setReady(true))
  }, [service]);

  return {
    enabled: Boolean(service),
    ready,
    service,
  };
}