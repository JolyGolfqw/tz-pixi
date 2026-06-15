import './style.css';
import type { Sprite } from '@pixi/sprite';
import { exportPixiContainerToPdf } from './pdf/exportPdf';
import { createPixiScene } from './scene/createScene';
import { findDisplayObjectAt } from './skia/hitTest';
import { SkiaPixiRenderer } from './skia/SkiaRenderer';
import type { SceneContext } from './types';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('App root not found');
}

root.innerHTML = `
  <section class="app-shell">
    <div class="toolbar">
      <h1>Pixi Container -> Skia</h1>
      <button id="add-shape" class="primary" type="button">Случайная фигура</button>
      <button id="export-pdf" type="button">Экспорт PDF</button>
      <div class="spacer"></div>
      <div id="status" class="status">Инициализация...</div>
    </div>
    <div class="stage-grid">
      <section class="viewport">
        <header><h2>Pixi canvas</h2></header>
        <div id="pixi-host" class="surface"></div>
      </section>
      <section class="viewport">
        <header><h2>Skia / CanvasKit canvas</h2></header>
        <div class="surface"><canvas id="skia-canvas" width="800" height="600"></canvas></div>
      </section>
    </div>
  </section>
`;

const pixiHost = document.querySelector<HTMLDivElement>('#pixi-host');
const skiaCanvas = document.querySelector<HTMLCanvasElement>('#skia-canvas');
const addButton = document.querySelector<HTMLButtonElement>('#add-shape');
const exportButton = document.querySelector<HTMLButtonElement>('#export-pdf');
const status = document.querySelector<HTMLDivElement>('#status');

if (!pixiHost || !skiaCanvas || !addButton || !exportButton || !status) {
  throw new Error('UI is not mounted');
}

const writeStatus = (message: string) => {
  status.textContent = message;
};

const sceneContext: SceneContext = {
  spriteBitmaps: new WeakMap<Sprite, { image: HTMLImageElement; dataUrl: string; width: number; height: number }>(),
  onSceneChanged: () => undefined,
  writeStatus,
};

const skiaRenderer = new SkiaPixiRenderer(skiaCanvas, sceneContext);
const scene = await createPixiScene(pixiHost, sceneContext);

sceneContext.onSceneChanged = () => {
  skiaRenderer.render(scene.mainContainer);
};

await skiaRenderer.init();
skiaRenderer.render(scene.mainContainer);
writeStatus('Готово: оба canvas отрисованы');

addButton.addEventListener('click', scene.addRandomShape);
exportButton.addEventListener('click', () => {
  exportPixiContainerToPdf(scene.mainContainer, sceneContext);
  writeStatus('PDF сгенерирован');
});

skiaCanvas.addEventListener('pointerdown', (event) => {
  const rect = skiaCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * skiaCanvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * skiaCanvas.height;
  const target = findDisplayObjectAt(scene.mainContainer, sceneContext, x, y);

  if (target) {
    (target as any).emit('pointerdown');
    writeStatus(`${target.name || target.constructor.name}: pointerDown on Skia canvas`);
  }
});

skiaCanvas.addEventListener('pointerup', (event) => {
  const rect = skiaCanvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * skiaCanvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * skiaCanvas.height;
  const target = findDisplayObjectAt(scene.mainContainer, sceneContext, x, y);

  if (target) {
    (target as any).emit('pointerup');
    writeStatus(`${target.name || target.constructor.name}: pointerUp on Skia canvas`);
  }
});
