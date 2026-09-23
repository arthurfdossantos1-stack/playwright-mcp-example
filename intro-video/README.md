# Intro WebBoost — anúncio de desenvolvimento de sites (Remotion)

Vídeo de 26s, 1920×1080 @ 30fps, com narração feminina em português, trilha baixa
(com ducking sob a voz) e SFX, tudo gerado localmente.
Feito com a skill `.claude/skills/remotion-motion-graphics`.

Cenas: "Sites" → "Design que converte." → URL digitada + clique → site se montando
em um navegador 3D → "Rápido." + 100 no PageSpeed → desktop + celular → logo WebBoost e CTA.

A logo foi redesenhada em SVG (`src/components/WebBoostLogo.tsx`) a partir de
`brand/webboost-logo-original.png`, com "Web" em branco para funcionar no fundo escuro.

## Personalizar
Marca, URL, slogan, CTA e contato ficam em `brand`, e as cores em `theme.colors`,
ambos em `src/theme.ts`.

## Narração
Falas e tempos ficam em `LINES` dentro de `scripts/gen-voice.py` (TTS neural offline Piper
via sherpa-onnx; voz feminina `dii-high` ou masculina `faber-medium`). Com `WHISPER_DIR`
definido, o script gera várias versões de cada fala e fica com a que o Whisper transcreve
com mais fidelidade. Veja o cabeçalho do script para os links dos modelos.
```bash
pip install sherpa-onnx numpy
WHISPER_DIR=<dir>/sherpa-onnx-whisper-small python3 scripts/gen-voice.py <dir-das-vozes> dii-high
```

## Comandos
```bash
npm install
node scripts/gen-sfx.mjs && node scripts/gen-track.mjs   # regenera áudio em public/sfx
npm run studio                                            # pré-visualização
npm run render                                            # gera out/intro.mp4
```
Em ambientes sem Chrome, passe `--browser-executable=<caminho do headless_shell>`.
