import { Jimp, loadFont, HorizontalAlign, VerticalAlign } from 'jimp';
import { SANS_16_BLACK } from '@jimp/plugin-print/fonts';

// Versao de teste do grid-image.js usando a fonte de verdade (Open Sans,
// suavizada) que vem com o jimp, em vez da fonte de pixel desenhada a mao.
// Mesmo layout/cores do gerador original, so pra comparar o resultado.

let cachedFont = null;
async function getFont() {
  if (!cachedFont) cachedFont = await loadFont(SANS_16_BLACK);
  return cachedFont;
}

const WHITE = 0xffffffff;
const GRID_LINE = 0xc8c8c8ff;
const X_COLOR = [190, 0, 0, 255];
const SOLD_BG = [255, 214, 214];
const CELL_BG = [255, 255, 255];

function fillCell(image, x0, y0, w, h, [r, g, b]) {
  image.scan(x0, y0, w, h, function (x, y, idx) {
    this.bitmap.data[idx + 0] = r;
    this.bitmap.data[idx + 1] = g;
    this.bitmap.data[idx + 2] = b;
    this.bitmap.data[idx + 3] = 255;
  });
}

function drawX(image, x0, y0, size, [r, g, b, a], thickness) {
  const half = Math.floor(thickness / 2);
  for (let i = 0; i < size; i++) {
    fillCellSafe(image, x0 + i - half, y0 + i - half, thickness, thickness, [r, g, b, a]);
    fillCellSafe(image, x0 + i - half, y0 + (size - 1 - i) - half, thickness, thickness, [r, g, b, a]);
  }
}

function fillCellSafe(image, x0, y0, w, h, [r, g, b, a]) {
  const { width, height } = image.bitmap;
  image.scan(Math.max(0, x0), Math.max(0, y0), Math.min(w, width - x0), Math.min(h, height - y0), function (x, y, idx) {
    this.bitmap.data[idx + 0] = r;
    this.bitmap.data[idx + 1] = g;
    this.bitmap.data[idx + 2] = b;
    this.bitmap.data[idx + 3] = a;
  });
}

export async function generateGridImageSmooth(raffle) {
  const font = await getFont();
  const total = raffle.total;
  const cols = Math.min(20, total);
  const rows = Math.ceil(total / cols);
  const cellSize = 44;
  const padding = 10;
  const width = cols * cellSize + padding * 2;
  const height = rows * cellSize + padding * 2;

  const image = new Jimp({ width, height, color: WHITE });

  for (let n = 1; n <= total; n++) {
    const idx = n - 1;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellX = padding + col * cellSize;
    const cellY = padding + row * cellSize;
    const entry = raffle.numbers[n];
    const sold = entry?.status === 'vendido';

    fillCell(image, cellX + 1, cellY + 1, cellSize - 2, cellSize - 2, sold ? SOLD_BG : CELL_BG);

    image.print({
      font,
      x: cellX,
      y: cellY,
      text: { text: String(n), alignmentX: HorizontalAlign.CENTER, alignmentY: VerticalAlign.MIDDLE },
      maxWidth: cellSize,
      maxHeight: cellSize,
    });

    if (sold) {
      drawX(image, cellX + 4, cellY + 4, cellSize - 8, X_COLOR, 2);
    }

    for (let x = cellX; x < cellX + cellSize; x++) image.setPixelColor(GRID_LINE, x, cellY);
    for (let y = cellY; y < cellY + cellSize; y++) image.setPixelColor(GRID_LINE, cellX, y);
  }

  for (let x = padding; x <= cols * cellSize + padding; x++) image.setPixelColor(GRID_LINE, x, rows * cellSize + padding);
  for (let y = padding; y <= rows * cellSize + padding; y++) image.setPixelColor(GRID_LINE, cols * cellSize + padding, y);

  return image.getBuffer('image/png');
}
