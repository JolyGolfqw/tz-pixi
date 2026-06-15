# Pixi Container to Skia

Тестовое приложение на TypeScript: сцена собирается в `pixi.js-legacy@7.2.4` с `forceCanvas: true`, затем тот же `PIXI.Container` обходится отдельной оберткой и отрисовывается в CanvasKit.

## Что реализовано

- Обход `PIXI.Container` с учетом вложенных контейнеров, `translate`, `rotate`, `scale` и `pivot`.
- Рендер `PIXI.Graphics`: `drawRect`, `drawEllipse`, `moveTo`, `lineTo`, `drawShape` через данные `GraphicsGeometry`.
- Рендер `PIXI.Sprite` как bitmap.
- Отдельный Skia/CanvasKit canvas рядом с Pixi canvas.
- `pointerDown` и `pointerUp` работают на Pixi canvas и на CanvasKit canvas через собственный hit-test.
- Кнопка добавляет случайные фигуры и линии в текущий контейнер.
- Экспорт PDF: `Graphics` пишутся в PDF векторными командами, `Sprite` добавляется bitmap, как разрешено в задании.

## Запуск

```bash
npm install
npm run dev
```

После запуска Vite откроет приложение на:

```text
http://127.0.0.1:5173
```

Для production-сборки:

```bash
npm run build
npm run preview
```

## Структура

- `src/scene` — создание тестового `PIXI.Container`.
- `src/skia` — обертка Pixi -> CanvasKit, чтение Graphics и hit-test.
- `src/pdf` — экспорт сцены в PDF.
- `src/math` — простые матрицы 2D для общего применения в Skia, PDF и событиях.

## Примечание по PDF backend

В браузерной сборке `canvaskit-wasm` нет публичного PDF surface API, поэтому PDF-экспорт вынесен в отдельный backend, который использует тот же обход сцены и сохраняет графику как векторные PDF-команды. Это оставляет результат редактируемым/масштабируемым в PDF; bitmap используется только для `PIXI.Sprite`.
