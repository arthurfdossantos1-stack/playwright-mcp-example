# WebBoost Reel — anúncio vertical de desenvolvimento de sites (Remotion)

Reel de 35,5s, **1080×1920 (9:16)** @ 30fps, com visual claro no estilo Apple, narração
gerada no Google AI Studio e trilha/SFX sintetizados localmente (a música abaixa sob a voz).

A timeline segue a narração: `src/narration.json` guarda os trechos de fala (detectados
no áudio) e `CUTS` em `src/WebBoostReel.tsx` define onde cada cena (`src/reel/*`) começa.
Destaques caem nas palavras: "cliente", o contador **R$ 300**, "Profissional / Moderno /
Extrema qualidade", o toque no WhatsApp em "um clique", o calendário **10 dias**, e o toque
em "Saiba mais" antes da logo.

A logo foi redesenhada em SVG (`src/components/WebBoostLogo.tsx`) a partir de
`brand/webboost-logo-original.png`.

## Trocar a narração
1. Normalize o novo áudio: `npx remotion ffmpeg -i novo.wav -af loudnorm=I=-16:TP=-1.5 public/vo/narracao-reel.mp3`
2. Atualize `file` e `segments` em `src/narration.json` (início/fim de cada frase em segundos).
3. Ajuste `CUTS`/`END_SEC` em `src/WebBoostReel.tsx` e os tempos no topo de `scripts/gen-track.mjs`.

## Personalizar
Marca, preço, prazo, URL, slogan, CTA e contato ficam em `brand`, e as cores em `theme.colors`,
ambos em `src/theme.ts`.

## Comandos
```bash
npm install
node scripts/gen-sfx.mjs && node scripts/gen-track.mjs   # regenera trilha e SFX
npm run studio                                            # pré-visualização
npm run render                                            # gera out/webboost-reel.mp4
```
Em ambientes sem Chrome, passe `--browser-executable=<caminho do headless_shell>`.
