import { jsPDF } from 'jspdf';
import { Container } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { SHAPES } from '@pixi/math';
import { Sprite } from '@pixi/sprite';
import { transformPoint } from '../math/matrix';
import type { Mat2D, SceneContext } from '../types';
import { collectDisplayObjects, colorToRgb, getGraphicsData, getShapeType } from '../skia/pixiReader';

const setColor = (doc: jsPDF, color: number, alpha = 1, stroke = false) => {
  const rgb = colorToRgb(color);
  doc.setGState(new (doc as any).GState({ opacity: alpha, 'stroke-opacity': alpha }));

  if (stroke) {
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
  } else {
    doc.setFillColor(rgb.r, rgb.g, rgb.b);
  }
};

const drawPolygon = (
  doc: jsPDF,
  matrix: Mat2D,
  points: number[],
  mode: 'F' | 'S',
) => {
  if (points.length < 4) {
    return;
  }

  const first = transformPoint(matrix, points[0], points[1]);
  const lines: Array<[number, number]> = [];

  for (let i = 2; i < points.length; i += 2) {
    const current = transformPoint(matrix, points[i], points[i + 1]);
    const prev = transformPoint(matrix, points[i - 2], points[i - 1]);
    lines.push([current.x - prev.x, current.y - prev.y]);
  }

  doc.lines(lines, first.x, first.y, [1, 1], mode, false);
};

const drawEllipse = (
  doc: jsPDF,
  matrix: Mat2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  mode: 'F' | 'S',
) => {
  const segments: number[] = [];

  for (let i = 0; i <= 48; i += 1) {
    const angle = (Math.PI * 2 * i) / 48;
    const point = transformPoint(matrix, x + Math.cos(angle) * rx, y + Math.sin(angle) * ry);
    segments.push(point.x, point.y);
  }

  drawPolygon(doc, [1, 0, 0, 1, 0, 0], segments, mode);
};

const drawRect = (
  doc: jsPDF,
  matrix: Mat2D,
  x: number,
  y: number,
  width: number,
  height: number,
  mode: 'F' | 'S',
) => {
  const points = [
    x,
    y,
    x + width,
    y,
    x + width,
    y + height,
    x,
    y + height,
    x,
    y,
  ];

  drawPolygon(doc, matrix, points, mode);
};

export const exportPixiContainerToPdf = (
  container: Container,
  context: SceneContext,
  filename = 'pixi-skia-scene.pdf',
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [800, 600],
    hotfixes: ['px_scaling'],
  });

  doc.setProperties({
    title: 'Pixi container exported through Skia-style vector commands',
    subject: 'Vector Graphics objects with bitmap Sprite exception',
    creator: 'pixi-skia-typescript-test',
  });

  for (const entry of collectDisplayObjects(container)) {
    const { object, matrix } = entry;

    if (object instanceof Graphics) {
      for (const data of getGraphicsData(object)) {
        const record = data as {
          shape: Record<string, any>;
          fillStyle?: { visible?: boolean; color?: number; alpha?: number };
          lineStyle?: { visible?: boolean; color?: number; alpha?: number; width?: number };
        };
        const type = getShapeType(record.shape);

        if (record.fillStyle?.visible) {
          setColor(doc, record.fillStyle.color ?? 0, record.fillStyle.alpha ?? 1);

          if (type === SHAPES.RECT) {
            drawRect(doc, matrix, record.shape.x, record.shape.y, record.shape.width, record.shape.height, 'F');
          } else if (type === SHAPES.ELIP) {
            drawEllipse(doc, matrix, record.shape.x, record.shape.y, record.shape.width, record.shape.height, 'F');
          } else if (type === SHAPES.POLY) {
            drawPolygon(doc, matrix, record.shape.points, 'F');
          }
        }

        if (record.lineStyle?.visible && record.lineStyle.width) {
          setColor(doc, record.lineStyle.color ?? 0, record.lineStyle.alpha ?? 1, true);
          doc.setLineWidth(record.lineStyle.width);

          if (type === SHAPES.RECT) {
            drawRect(doc, matrix, record.shape.x, record.shape.y, record.shape.width, record.shape.height, 'S');
          } else if (type === SHAPES.ELIP) {
            drawEllipse(doc, matrix, record.shape.x, record.shape.y, record.shape.width, record.shape.height, 'S');
          } else if (type === SHAPES.POLY) {
            drawPolygon(doc, matrix, record.shape.points, 'S');
          }
        }
      }
    }

    if (object instanceof Sprite) {
      const bitmap = context.spriteBitmaps.get(object);

      if (bitmap) {
        const left = -object.anchor.x * bitmap.width;
        const top = -object.anchor.y * bitmap.height;
        const p = transformPoint(matrix, left, top);
        const rotation = (Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI;
        const scaleX = Math.hypot(matrix[0], matrix[1]);
        const scaleY = Math.hypot(matrix[2], matrix[3]);

        doc.addImage(bitmap.dataUrl, 'PNG', p.x, p.y, bitmap.width * scaleX, bitmap.height * scaleY, undefined, 'FAST', rotation);
      }
    }
  }

  doc.save(filename);
};
