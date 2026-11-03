import { useGameFrame } from './UseGameFrame';

export type Loadable = { id: string };

export const useLoaded = ({ id }: Loadable): boolean => {
  const order = useGameFrame<string[]>(['core.modules', 'order']);
  return Array.isArray(order) && order.includes(id);
};
