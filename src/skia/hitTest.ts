import { Container, type DisplayObject } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { SHAPES } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { invert, transformPoint } from '../math/matrix';
import type { SceneContext } from '../types';
import { collectDisplayObjects, getGraphicsData, getShapeType } from './pixiReader';

const distanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) => {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq));
  const x = ax + t * dx;
  const y = ay + t * dy;

  return Math.hypot(px - x, py - y);
};

const pointInPolygon = (x: number, y: number, points: number[]) => {
  let inside = false;

  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const xi = points[i];
    const yi = points[i + 1];
    const xj = points[j];
    const yj = points[j + 1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
};

const hitGraphics = (graphics: Graphics, x: number, y: number) => {
  for (const data of getGraphicsData(graphics)) {
    const shape = (data as { shape: unknown }).shape as Record<string, any>;
    const type = getShapeType(shape);
    const fill = (data as { fillStyle?: { visible?: boolean } }).fillStyle;
    const line = (data as { lineStyle?: { visible?: boolean; width?: number } }).lineStyle;

    if (type === SHAPES.RECT) {
      const inside = x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;

      if (inside) {
        return true;
      }
    }

    if (type === SHAPES.ELIP) {
      const nx = (x - shape.x) / shape.width;
      const ny = (y - shape.y) / shape.height;

      if (nx * nx + ny * ny <= 1) {
        return true;
      }
    }

    if (type === SHAPES.POLY && Array.isArray(shape.points)) {
      if (fill?.visible && pointInPolygon(x, y, shape.points)) {
        return true;
      }

      if (line?.visible) {
        for (let i = 0; i < shape.points.length - 2; i += 2) {
          if (distanceToSegment(x, y, shape.points[i], shape.points[i + 1], shape.points[i + 2], shape.points[i + 3]) <= (line.width ?? 1) / 2 + 4) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

const hitSprite = (sprite: Sprite, context: SceneContext, x: number, y: number) => {
  const bitmap = context.spriteBitmaps.get(sprite);
  const width = bitmap?.width ?? sprite.width;
  const height = bitmap?.height ?? sprite.height;
  const left = -sprite.anchor.x * width;
  const top = -sprite.anchor.y * height;

  return x >= left && x <= left + width && y >= top && y <= top + height;
};

export const findDisplayObjectAt = (
  container: Container,
  context: SceneContext,
  x: number,
  y: number,
) => {
  const entries = collectDisplayObjects(container);

  for (let i = entries.length - 1; i >= 0; i -= 1) {
    const { object, matrix } = entries[i];
    const inverse = invert(matrix);

    if (!inverse) {
      continue;
    }

    const local = transformPoint(inverse, x, y);

    if (object instanceof Graphics && hitGraphics(object, local.x, local.y)) {
      return object;
    }

    if (object instanceof Sprite && hitSprite(object, context, local.x, local.y)) {
      return object;
    }
  }

  return null as DisplayObject | null;
};
