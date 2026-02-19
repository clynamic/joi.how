import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGameEngine } from './hooks/UseGameEngine';
import { useGameFrame } from './hooks';
import Scene from './plugins/scene';

const routeToScene: Record<string, string> = {
  '/': 'home',
  '/play': 'game',
  '/end': 'end',
};

const sceneToRoute: Record<string, string> = {
  home: '/',
  game: '/play',
  end: '/end',
};

export const SceneBridge = () => {
  const { injectImpulse } = useGameEngine();
  const location = useLocation();
  const navigate = useNavigate();
  const sceneState = useGameFrame(Scene.paths) as
    | { current?: string }
    | undefined;

  const lastRouteSceneRef = useRef<string | null>(null);

  useEffect(() => {
    const scene = routeToScene[location.pathname] ?? 'unknown';
    lastRouteSceneRef.current = scene;
    injectImpulse(Scene.setScene(scene));
  }, [location.pathname, injectImpulse]);

  useEffect(() => {
    const current = sceneState?.current;
    if (!current || current === 'unknown') return;
    if (current === lastRouteSceneRef.current) return;

    const route = sceneToRoute[current];
    if (!route) return;

    lastRouteSceneRef.current = current;
    navigate(route);
  }, [navigate, sceneState]);

  return null;
};
