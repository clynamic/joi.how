import { Frames } from '../engine/Frames';
import { lensFromPath } from '../engine/Lens';
import { GameFrame } from '../engine/State';
import { sdk } from '../engine/sdk';
import Scene, { SceneState } from '../game/scene';

const routeToScene: Record<string, string> = {
  '/': 'home',
  '/play': 'game',
  '/end': 'end',
};

const sceneToRoute: Record<string, string> = {
  boot: '/',
  home: '/',
  game: '/play',
  end: '/end',
};

const sceneOf = (path: string) => routeToScene[path] ?? 'home';

export const startRouter = (): (() => void) => {
  let lastRouteScene: string | null = null;
  let booted = false;

  const follow = () => {
    const scene = sceneOf(location.pathname);
    if (!(location.pathname in routeToScene))
      history.replaceState(null, '', '/');
    lastRouteScene = scene;
    sdk.inject(Scene.setScene(scene));
  };

  const unsubscribe = Frames.subscribe(frame => {
    const current = lensFromPath<GameFrame, SceneState>(Scene.paths).get(
      frame
    )?.current;
    if (!current || current === 'boot') return;
    if (!booted) {
      booted = true;
      follow();
      return;
    }
    if (current === 'unknown' || current === lastRouteScene) return;
    const route = sceneToRoute[current];
    if (!route) return;
    lastRouteScene = current;
    if (location.pathname !== route) history.pushState(null, '', route);
  });

  const onPop = () => {
    if (booted) follow();
  };
  window.addEventListener('popstate', onPop);

  return () => {
    unsubscribe();
    window.removeEventListener('popstate', onPop);
  };
};
