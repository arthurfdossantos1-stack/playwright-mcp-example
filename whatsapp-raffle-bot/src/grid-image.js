import { PNG } from 'pngjs';

// Fonte de pixels 5x7 para os digitos, no estilo painel de LED. Cada string e
// uma linha do glifo (1 = pixel aceso). Evita depender de canvas/sharp (que
// nao instalam bem no Termux) so pra desenhar numeros numa imagem.
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

function setPixel(png, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x0, y0, w, h, color) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(png, x, y, color);
    }
  }
}

function drawDigit(png, x0, y0, digit, scale, color) {
  const glyph = DIGIT_FONT[digit];
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col] === '1') {
        fillRect(png, x0 + col * scale, y0 + row * scale, scale, scale, color);
      }
    }
  }
}

function drawNumberCentered(png, centerX, centerY, number, scale, color) {
  const digits = String(number).split('').map(Number);
  const glyphWidth = 5 * scale;
  const glyphHeight = 7 * scale;
  const gap = scale;
  const totalWidth = digits.length * glyphWidth + (digits.length - 1) * gap;
  let x = Math.round(centerX - totalWidth / 2);
  const y = Math.round(centerY - glyphHeight / 2);
  for (const digit of digits) {
    drawDigit(png, x, y, digit, scale, color);
    x += glyphWidth + gap;
  }
}

function drawX(png, x0, y0, size, color, thickness) {
  const half = Math.floor(thickness / 2);
  for (let i = 0; i < size; i++) {
    fillRect(png, x0 + i - half, y0 + i - half, thickness, thickness, color);
    fillRect(png, x0 + i - half, y0 + (size - 1 - i) - half, thickness, thickness, color);
  }
}

const WHITE = [255, 255, 255, 255];
const SOLD_BG = [255, 214, 214, 255];
const GRID_LINE = [190, 190, 190, 255];
const TEXT_AVAILABLE = [20, 20, 20, 255];
const TEXT_SOLD = [130, 60, 60, 255];
const X_COLOR = [190, 0, 0, 255];

// Gera um PNG com uma celula por numero da rifa: fundo branco + numero para
// os disponiveis, fundo rosado + numero + X vermelho por cima para os
// vendidos. Retorna um Buffer PNG pronto para mandar como imagem.
export function generateGridImage(raffle) {
  const total = raffle.total;
  const cols = Math.min(20, total);
  const rows = Math.ceil(total / cols);
  const cellSize = 44;
  const padding = 10;
  const width = cols * cellSize + padding * 2;
  const height = rows * cellSize + padding * 2;

  const png = new PNG({ width, height });
  fillRect(png, 0, 0, width, height, WHITE);

  for (let n = 1; n <= total; n++) {
    const idx = n - 1;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cellX = padding + col * cellSize;
    const cellY = padding + row * cellSize;
    const entry = raffle.numbers[n];
    const sold = entry?.status === 'vendido';

    fillRect(png, cellX + 1, cellY + 1, cellSize - 2, cellSize - 2, sold ? SOLD_BG : WHITE);
    drawNumberCentered(png, cellX + cellSize / 2, cellY + cellSize / 2, n, 2, sold ? TEXT_SOLD : TEXT_AVAILABLE);

    if (sold) {
      drawX(png, cellX + 4, cellY + 4, cellSize - 8, X_COLOR, 3);
    }

    for (let x = cellX; x < cellX + cellSize; x++) setPixel(png, x, cellY, GRID_LINE);
    for (let y = cellY; y < cellY + cellSize; y++) setPixel(png, cellX, y, GRID_LINE);
  }

  // borda direita/inferior da grade
  for (let x = padding; x <= cols * cellSize + padding; x++) setPixel(png, x, rows * cellSize + padding, GRID_LINE);
  for (let y = padding; y <= rows * cellSize + padding; y++) setPixel(png, cols * cellSize + padding, y, GRID_LINE);

  return PNG.sync.write(png);
}
