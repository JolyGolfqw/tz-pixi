import { Container, type DisplayObject } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { fromDisplayObject, identity, multiply } from '../math/matrix';
import type { Mat2D } from '../types';

export interface DisplayEntry {
  object: DisplayObject;
  matrix: Mat2D;
}

export const collectDisplayObjects = (
  container: Container,
  parentMatrix: Mat2D = identity(),
  out: DisplayEntry[] = [],
) => {
  for (const child of container.children) {
    if (!child.visible || child.alpha <= 0) {
      continue;
    }

    const matrix = multiply(parentMatrix, fromDisplayObject(child));
    out.push({ object: child, matrix });

    if (child instanceof Container) {
      collectDisplayObjects(child, matrix, out);
    }
  }

  return out;
};

export const getGraphicsData = (graphics: Graphics) => {
  graphics.finishPoly();
  return (graphics.geometry as unknown as { graphicsData: unknown[] }).graphicsData ?? [];
};

export const getShapeType = (shape: unknown): number =>
  Number((shape as { type?: number }).type ?? -1);

export const colorToRgb = (color: number) => ({
  r: (color >> 16) & 255,
  g: (color >> 8) & 255,
  b: color & 255,
});
