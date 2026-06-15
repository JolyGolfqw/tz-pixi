import 'pixi.js-legacy';
import { Application } from '@pixi/app';
import { Container, type DisplayObject } from '@pixi/display';
import { Graphics } from '@pixi/graphics';
import { Sprite } from '@pixi/sprite';
import type { SceneContext } from '../types';
import { createSpriteBitmap, rememberSpriteBitmap } from './spriteAsset';

export interface SceneBundle {
  app: Application<HTMLCanvasElement>;
  mainContainer: Container;
  addRandomShape: () => void;
}

const labelObject = (displayObject: DisplayObject, name: string, context: SceneContext) => {
  displayObject.name = name;
  displayObject.eventMode = 'static';
  displayObject.cursor = 'pointer';
  displayObject.on('pointerdown', () => context.writeStatus(`${name}: pointerDown on Pixi canvas`));
  displayObject.on('pointerup', () => context.writeStatus(`${name}: pointerUp on Pixi canvas`));
};

export const createPixiScene = async (
  host: HTMLElement,
  context: SceneContext,
): Promise<SceneBundle> => {
  const app = new Application<HTMLCanvasElement>({
    width: 800,
    height: 600,
    backgroundColor: 0xffffff,
    antialias: true,
    forceCanvas: true,
  });

  host.appendChild(app.view);

  const mainContainer = new Container();
  const subContainer = new Container();
  const g1 = new Graphics();
  const g2 = new Graphics();
  const g3 = new Graphics();
  const g4 = new Graphics();

  g1.beginFill('#ff0000').drawEllipse(0, 0, 200, 100).endFill();
  g1.position.set(200, 120);
  g1.angle = 30;
  labelObject(g1, 'g1', context);

  g2.beginFill('#0000ff').drawRect(-50, -75, 100, 150).endFill();
  g2.position.set(120, 60);
  g2.angle = 15;
  g2.scale.set(1.5, 1.7);
  labelObject(g2, 'g2', context);

  g3.lineStyle(10, '#ffffff', 1).moveTo(0, 0).lineTo(150, 100);
  g3.angle = -20;

  g4.lineStyle(10, '#ffff00', 1).moveTo(0, 70).lineTo(150, -30);
  g4.angle = 20;

  labelObject(g3, 'g3', context);
  labelObject(g4, 'g4', context);

  subContainer.position.set(75, 50);
  subContainer.addChild(g3, g4);
  mainContainer.addChild(subContainer, g1, g2);

  const bitmap = await createSpriteBitmap();
  const sprite = Sprite.from(bitmap.dataUrl);
  rememberSpriteBitmap(context.spriteBitmaps, sprite, bitmap);
  sprite.position.set(520, 260);
  sprite.anchor.set(0.5);
  sprite.scale.set(1.15);
  sprite.angle = -12;
  labelObject(sprite, 'sprite', context);
  mainContainer.addChild(sprite);

  app.stage.addChild(mainContainer);

  const addRandomShape = () => {
    const g = new Graphics();
    const color = Math.floor(Math.random() * 0xffffff);
    const x = 120 + Math.random() * 540;
    const y = 130 + Math.random() * 350;

    if (Math.random() > 0.45) {
      const w = 50 + Math.random() * 130;
      const h = 40 + Math.random() * 100;
      g.beginFill(color, 0.72).drawRect(-w / 2, -h / 2, w, h).endFill();
    } else {
      g.lineStyle(6 + Math.random() * 8, color, 0.9)
        .moveTo(-70, -30 + Math.random() * 60)
        .lineTo(70, -30 + Math.random() * 60);
    }

    g.position.set(x, y);
    g.angle = -35 + Math.random() * 70;
    g.scale.set(0.7 + Math.random() * 0.8);
    labelObject(g, 'random shape', context);
    mainContainer.addChild(g);
    context.writeStatus('Случайная фигура добавлена');
    context.onSceneChanged();
  };

  context.onSceneChanged();

  return { app, mainContainer, addRandomShape };
};
