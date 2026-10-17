import { ReactNode } from 'react';
import { useLoaded, Loadable } from '../hooks/UseLoaded';

type Props = {
  plugin: Loadable;
  children: ReactNode;
};

export const WhenLoaded = ({ plugin, children }: Props) => {
  const loaded = useLoaded(plugin);
  return loaded ? <>{children}</> : null;
};
