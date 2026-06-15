import type { Sprite } from '@pixi/sprite';

export type Mat2D = [number, number, number, number, number, number];

export interface SpriteBitmap {
  image: HTMLImageElement;
  dataUrl: string;
  width: number;
  height: number;
}

export interface SceneContext {
  spriteBitmaps: WeakMap<Sprite, SpriteBitmap>;
  onSceneChanged: () => void;
  writeStatus: (message: string) => void;
}
