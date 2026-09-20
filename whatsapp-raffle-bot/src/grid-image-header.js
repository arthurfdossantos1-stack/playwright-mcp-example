import { Jimp, loadFont, HorizontalAlign } from 'jimp';
import { SANS_32_WHITE, SANS_16_WHITE } from '@jimp/plugin-print/fonts';

// Versao de TESTE do grid-image.js com uma faixa de titulo em cima (nome da
// rifa, valor por numero, data do sorteio). A grade de numeros usa a mesma
// fonte de pixel de sempre (copiada aqui pra nao mexer em grid-image.js);
// o titulo usa a fonte de verdade do jimp, ja que precisa de letras (o
// desenho de pixel so tem digitos).

const DIGIT_FONT = {
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
};

function setPixel(bitmap, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= bitmap.width || y >= bitmap.height) return;
  const idx = (bitmap.width * y + x) << 2;
  bitmap.data[idx] = r;
  bitmap.data[idx + 1] = g;
  bitmap.data[idx + 2] = b;
  bitmap.data[idx + 3] = a;
}

function fillRect(bitmap, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(bitmap, x, y, color);
    }
  }
}

function drawDigit(bitmap, x0, y0, digit, scale, color) {
  const glyph = DIGIT_FONT[digit];
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] === '1') {
        fillRect(bitmap, x0 + col * scale, y0 + row * scale, scale, scale, color);
      }
    }
  }
}

function drawNumberCentered(bitmap, centerX, centerY, number, scale, color) {
  const digits = String(number).split('').map(Number);
  const glyphWidth = 5 * scale;
  const glyphHeight = 7 * scale;
  const gap = scale;
  const totalWidth = digits.length * glyphWidth + (digits.length - 1) * gap;
  let x = Math.round(centerX - totalWidth / 2);
  const y = Math.round(centerY - glyphHeight / 2);
  for (const digit of digits) {
    drawDigit(bitmap, x, y, digit, scale, color);
    x += glyphWidth + gap;
  }
}

function drawX(bitmap, x0, y0, size, color, thickness) {
  const half = Math.floor(thickness / 2);
  for (let i = 0; i < size; i++) {
    fillRect(bitmap, x0 + i - half, y0 + i - half, thickness, thickness, color);
    fillRect(bitmap, x0 + i - half, y0 + (size - 1 - i) - half, thickness, thickness, color);
  }
}

const WHITE = [255, 255, 255, 255];
const WHITE_INT = 0xffffffff;
const SOLD_BG = [255, 214, 214, 255];
const GRID_LINE = [190, 190, 190, 255];
const TEXT_AVAILABLE = [20, 20, 20, 255];
const TEXT_SOLD = [130, 60, 60, 255];
const X_COLOR = [190, 0, 0, 255];

let cachedFonts = null;
async function getFonts() {
  if (!cachedFonts) {
    cachedFonts = {
      big: await loadFont(SANS_32_WHITE),
      small: await loadFont(SANS_16_WHITE),
    };
  }
  return cachedFonts;
}

export async function generateGridImageWithHeader(raffle, price, date) {
  const fonts = await getFonts();

  const total = raffle.total;
  const cols = Math.min(20, total);
  const rows = Math.ceil(total / cols);
  const cellSize = 44;
  const padding = 10;
  const width = cols * cellSize + padding * 2;
  const gridHeight = rows * cellSize + padding * 2;
  const headerHeight = 130;
  const height = headerHeight + gridHeight;

  const image = new Jimp({ width, height, color: WHITE_INT });

  image.scan(0, 0, width, headerHeight, function (x, y, idx) {
    this.bitmap.data[idx + 0] = 0x1a;
    this.bitmap.data[idx + 1] = 0x46;
    this.bitmap.data[idx + 2] = 0x6e;
    this.bitmap.data[idx + 3] = 0xff;
  });

  image.print({
    font: fonts.big,
    x: 0,
    y: 14,
    text: { text: raffle.name, alignmentX: HorizontalAlign.CENTER },
    maxWidth: width,
  });
  image.print({
    font: fonts.small,
    x: 0,
    y: 62,
    text: { text: `Cada numero: R$ ${price}`, alignmentX: HorizontalAlign.CENTER },
    maxWidth: width,
  });
  image.print({
    font: fonts.small,
    x: 0,
    y: 88,
    text: { text: `Sorteio: ${date}`, alignmentX: HorizontalAlign.CENTER },
    maxWidth: width,
  });

  const bitmap = image.bitmap;
  fillRect(bitmap, 0, headerHeight, width, gridHeight, WHITE);

  for (let n = 1; n <= total; n++) {
    const idx = n - 1;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellX = padding + col * cellSize;
    const cellY = headerHeight + padding + row * cellSize;
    const entry = raffle.numbers[n];
    const sold = entry?.status === 'vendido';

    fillRect(bitmap, cellX + 1, cellY + 1, cellSize - 2, cellSize - 2, sold ? SOLD_BG : WHITE);
    drawNumberCentered(bitmap, cellX + cellSize / 2, cellY + cellSize / 2, n, 2, sold ? TEXT_SOLD : TEXT_AVAILABLE);

    if (sold) {
      drawX(bitmap, cellX + 4, cellY + 4, cellSize - 8, X_COLOR, 3);
    }

    for (let x = cellX; x < cellX + cellSize; x++) setPixel(bitmap, x, cellY, GRID_LINE);
    for (let y = cellY; y < cellY + cellSize; y++) setPixel(bitmap, cellX, y, GRID_LINE);
  }

  for (let x = padding; x <= cols * cellSize + padding; x++) setPixel(bitmap, x, rows * cellSize + headerHeight + padding, GRID_LINE);
  for (let y = headerHeight + padding; y <= rows * cellSize + headerHeight + padding; y++) {
    setPixel(bitmap, cols * cellSize + padding, y, GRID_LINE);
  }

  return image.getBuffer('image/png');
}
