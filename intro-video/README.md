# Intro — anúncio de desenvolvimento de sites (Remotion)

Vídeo de 24,5s, 1920×1080 @ 30fps, com trilha e SFX sintetizados localmente.
Feito com a skill `.claude/skills/remotion-motion-graphics`.

Cenas: "Sites" → "Design que converte." → URL digitada + clique → site se montando
em um navegador 3D → "Rápido." + 100 no PageSpeed → desktop + celular → logo e CTA.

## Personalizar
Marca, URL, slogan, CTA e contato ficam em `brand`, e as cores em `theme.colors`,
ambos em `src/theme.ts`.

## Comandos
```bash
npm install
node scripts/gen-sfx.mjs && node scripts/gen-track.mjs   # regenera áudio em public/sfx
npm run studio                                            # pré-visualização
npm run render                                            # gera out/intro.mp4
```
Em ambientes sem Chrome, passe `--browser-executable=<caminho do headless_shell>`.
