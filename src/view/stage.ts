import { Frames } from '../engine/Frames';
import { lensFromPath } from '../engine/Lens';
import { GameFrame } from '../engine/State';
import Scene, { SceneState } from '../game/scene';

export const startStage = (
  root: HTMLElement,
  pages: Record<string, string>
): (() => void) => {
  let shown: string | null = null;
  const read = lensFromPath<GameFrame, SceneState>(Scene.paths).get;
  return Frames.subscribe(frame => {
    const scene = read(frame)?.current;
    const tag = scene ? (pages[scene] ?? null) : null;
    if (tag === shown) return;
    shown = tag;
    root.replaceChildren(...(tag ? [document.createElement(tag)] : []));
  });
};
