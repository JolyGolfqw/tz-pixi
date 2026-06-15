import type { Mat2D } from '../types';

export const identity = (): Mat2D => [1, 0, 0, 1, 0, 0];

export const multiply = (a: Mat2D, b: Mat2D): Mat2D => [
  a[0] * b[0] + a[2] * b[1],
  a[1] * b[0] + a[3] * b[1],
  a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3],
  a[0] * b[4] + a[2] * b[5] + a[4],
  a[1] * b[4] + a[3] * b[5] + a[5],
];

export const invert = (m: Mat2D): Mat2D | null => {
  const det = m[0] * m[3] - m[1] * m[2];

  if (Math.abs(det) < 0.000001) {
    return null;
  }

  return [
    m[3] / det,
    -m[1] / det,
    -m[2] / det,
    m[0] / det,
    (m[2] * m[5] - m[3] * m[4]) / det,
    (m[1] * m[4] - m[0] * m[5]) / det,
  ];
};

export const transformPoint = (m: Mat2D, x: number, y: number) => ({
  x: m[0] * x + m[2] * y + m[4],
  y: m[1] * x + m[3] * y + m[5],
});

export const fromDisplayObject = (displayObject: {
  position: { x: number; y: number };
  rotation: number;
  scale: { x: number; y: number };
  pivot: { x: number; y: number };
}): Mat2D => {
  const cos = Math.cos(displayObject.rotation);
  const sin = Math.sin(displayObject.rotation);
  const a = cos * displayObject.scale.x;
  const b = sin * displayObject.scale.x;
  const c = -sin * displayObject.scale.y;
  const d = cos * displayObject.scale.y;
  const tx = displayObject.position.x - displayObject.pivot.x * a - displayObject.pivot.y * c;
  const ty = displayObject.position.y - displayObject.pivot.x * b - displayObject.pivot.y * d;

  return [a, b, c, d, tx, ty];
};
