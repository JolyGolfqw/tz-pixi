import type { Sprite } from '@pixi/sprite';
import type { SpriteBitmap } from '../types';

export const createSpriteBitmap = async (): Promise<SpriteBitmap> => {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D is not available');
  }

  ctx.fillStyle = '#f8fbff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#26a269';
  ctx.beginPath();
  ctx.arc(64, 64, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(51, 35);
  ctx.lineTo(96, 64);
  ctx.lineTo(51, 93);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#1f2328';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 112, 112);

  const dataUrl = canvas.toDataURL('image/png');
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  return {
    image,
    dataUrl,
    width: canvas.width,
    height: canvas.height,
  };
};

export const rememberSpriteBitmap = (
  map: WeakMap<Sprite, SpriteBitmap>,
  sprite: Sprite,
  bitmap: SpriteBitmap,
) => {
  map.set(sprite, bitmap);
};
