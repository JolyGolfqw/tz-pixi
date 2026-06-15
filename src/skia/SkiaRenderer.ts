import CanvasKitInit, { type Canvas, type CanvasKit, type Paint, type Surface } from 'canvaskit-wasm';
import canvasKitWasmUrl from 'canvaskit-wasm/bin/canvaskit.wasm?url';
import { Container } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { SHAPES } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { transformPoint } from '../math/matrix';
import type { Mat2D, SceneContext } from '../types';
import { collectDisplayObjects, colorToRgb, getGraphicsData, getShapeType } from './pixiReader';

export class SkiaPixiRenderer {
  private canvasKit: CanvasKit | null = null;
  private surface: Surface | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly context: SceneContext,
  ) {}

  async init() {
    this.canvasKit = await CanvasKitInit({
      locateFile: (file) => (file.endsWith('.wasm') ? canvasKitWasmUrl : file),
    });

    this.surface = this.canvasKit.MakeCanvasSurface(this.canvas);

    if (!this.surface) {
      throw new Error('Cannot create CanvasKit surface');
    }
  }

  render(container: Container) {
    if (!this.canvasKit || !this.surface) {
      return;
    }

    const canvas = this.surface.getCanvas();
    canvas.clear(this.canvasKit.WHITE);

    for (const entry of collectDisplayObjects(container)) {
      if (entry.object instanceof Graphics) {
        this.drawGraphics(canvas, entry.object, entry.matrix);
      }

      if (entry.object instanceof Sprite) {
        this.drawSprite(canvas, entry.object, entry.matrix);
      }
    }

    this.surface.flush();
  }

  private drawGraphics(canvas: Canvas, graphics: Graphics, matrix: Mat2D) {
    if (!this.canvasKit) {
      return;
    }

    canvas.save();
    canvas.concat(matrix);

    for (const data of getGraphicsData(graphics)) {
      const record = data as {
        shape: Record<string, any>;
        fillStyle?: { visible?: boolean; color?: number; alpha?: number };
        lineStyle?: { visible?: boolean; color?: number; alpha?: number; width?: number };
      };

      if (record.fillStyle?.visible) {
        const paint = this.makePaint(record.fillStyle.color ?? 0, record.fillStyle.alpha ?? graphics.worldAlpha, true);
        this.drawShape(canvas, record.shape, paint);
        paint.delete();
      }

      if (record.lineStyle?.visible && record.lineStyle.width) {
        const paint = this.makePaint(record.lineStyle.color ?? 0, record.lineStyle.alpha ?? graphics.worldAlpha, false);
        paint.setStrokeWidth(record.lineStyle.width);
        this.drawShape(canvas, record.shape, paint);
        paint.delete();
      }
    }

    canvas.restore();
  }

  private drawShape(canvas: Canvas, shape: Record<string, any>, paint: Paint) {
    if (!this.canvasKit) {
      return;
    }

    const type = getShapeType(shape);

    if (type === SHAPES.RECT) {
      canvas.drawRect(this.canvasKit.XYWHRect(shape.x, shape.y, shape.width, shape.height), paint);
      return;
    }

    if (type === SHAPES.ELIP) {
      canvas.drawOval(this.canvasKit.LTRBRect(shape.x - shape.width, shape.y - shape.height, shape.x + shape.width, shape.y + shape.height), paint);
      return;
    }

    if (type === SHAPES.POLY && Array.isArray(shape.points)) {
      const commands = [`M ${shape.points[0]} ${shape.points[1]}`];

      for (let i = 2; i < shape.points.length; i += 2) {
        commands.push(`L ${shape.points[i]} ${shape.points[i + 1]}`);
      }

      if (shape.closeStroke) {
        commands.push('Z');
      }

      const path = this.canvasKit.Path.MakeFromSVGString(commands.join(' '));

      if (path) {
        canvas.drawPath(path, paint);
        path.delete();
      }
    }
  }

  private drawSprite(canvas: Canvas, sprite: Sprite, matrix: Mat2D) {
    if (!this.canvasKit) {
      return;
    }

    const bitmap = this.context.spriteBitmaps.get(sprite);

    if (!bitmap) {
      return;
    }

    const image = this.canvasKit.MakeImageFromCanvasImageSource(bitmap.image);
    const left = -sprite.anchor.x * bitmap.width;
    const top = -sprite.anchor.y * bitmap.height;
    const topLeft = transformPoint(matrix, left, top);
    const topRight = transformPoint(matrix, left + bitmap.width, top);
    const bottomRight = transformPoint(matrix, left + bitmap.width, top + bitmap.height);
    const bottomLeft = transformPoint(matrix, left, top + bitmap.height);
    const path = this.canvasKit.Path.MakeFromSVGString(
      `M ${topLeft.x} ${topLeft.y} L ${topRight.x} ${topRight.y} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`,
    );

    if (!path) {
      image.delete();
      return;
    }

    canvas.save();
    canvas.clipPath(path, this.canvasKit.ClipOp.Intersect, true);
    canvas.concat(matrix);
    canvas.drawImage(image, left, top, null);
    canvas.restore();
    path.delete();
    image.delete();
  }

  private makePaint(color: number, alpha: number, fill: boolean) {
    if (!this.canvasKit) {
      throw new Error('CanvasKit is not initialized');
    }

    const rgb = colorToRgb(color);
    const paint = new this.canvasKit.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(fill ? this.canvasKit.PaintStyle.Fill : this.canvasKit.PaintStyle.Stroke);
    paint.setColor(this.canvasKit.Color(rgb.r, rgb.g, rgb.b, alpha));

    return paint;
  }
}
