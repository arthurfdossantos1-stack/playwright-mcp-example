import { spawn } from 'child_process';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

// Redimensiona/centraliza em 512x512 com fundo transparente, do jeito que o
// WhatsApp espera pra figurinha.
const PAD_FILTER =
  'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000';

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args);
    let stderr = '';
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    proc.on('error', (err) => {
      if (err.code === 'ENOENT') {
        reject(
          new Error(
            'ffmpeg nao encontrado. Instale com "pkg install ffmpeg" (Termux) e tente de novo.'
          )
        );
      } else {
        reject(err);
      }
    });
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg terminou com erro (codigo ${code}): ${stderr.slice(-400)}`));
    });
  });
}

// Converte uma imagem ou video/GIF (buffer) numa figurinha WEBP do WhatsApp.
// animated=true usa o codec de animacao do libwebp (video/GIF); caso
// contrario gera uma figurinha estatica de um frame so.
export async function createStickerFromMedia(buffer, { animated = false } = {}) {
  const id = crypto.randomUUID();
  const inputPath = path.join(os.tmpdir(), `sticker-in-${id}`);
  const outputPath = path.join(os.tmpdir(), `sticker-out-${id}.webp`);

  await fs.writeFile(inputPath, buffer);

  try {
    const args = animated
      ? [
          '-y',
          '-i', inputPath,
          '-vf', `${PAD_FILTER},fps=15`,
          '-vcodec', 'libwebp_anim',
          '-loop', '0',
          '-an',
          '-vsync', '0',
          '-t', '6',
          '-qscale', '60',
          '-compression_level', '6',
          outputPath,
        ]
      : [
          '-y',
          '-i', inputPath,
          '-vf', PAD_FILTER,
          '-vcodec', 'libwebp',
          '-pix_fmt', 'yuva420p',
          '-qscale', '80',
          '-frames:v', '1',
          outputPath,
        ];

    await runFfmpeg(args);
    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => {});
    await fs.rm(outputPath, { force: true }).catch(() => {});
  }
}
