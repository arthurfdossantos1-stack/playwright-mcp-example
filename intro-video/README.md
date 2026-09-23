# Intro WebBoost — anúncio de desenvolvimento de sites (Remotion)

Vídeo de 38,5s, 1920×1080 @ 30fps, narrado pela voz "Roberta" do ElevenLabs,
com trilha e SFX sintetizados localmente (a música abaixa sob a voz).

A timeline segue a narração: `src/narration.json` guarda os trechos de fala
(detectados no áudio) e `CUTS` em `src/WebDevIntro.tsx` define onde cada cena começa.

Cenas: "Sem site?" → WebBoost + "Sites que trabalham por você." → URL digitada + clique
(no "clica") → site se montando em navegador 3D → "Rápido." + PageSpeed → desktop +
celular → logo WebBoost e CTA.

A logo foi redesenhada em SVG (`src/components/WebBoostLogo.tsx`) a partir de
`brand/webboost-logo-original.png`, com "Web" em branco para o fundo escuro.

## Trocar a narração
1. Gere o novo MP3 e normalize: `npx remotion ffmpeg -i novo.mp3 -af loudnorm=I=-16:TP=-1.5 public/vo/narracao.mp3`
2. Atualize `file` e `segments` em `src/narration.json` (início/fim de cada frase em segundos).
3. Ajuste `CUTS`/`END_SEC` em `src/WebDevIntro.tsx` e os cortes no topo de `scripts/gen-track.mjs`.

## Personalizar
Marca, URL, slogan, CTA e contato ficam em `brand`, e as cores em `theme.colors`,
ambos em `src/theme.ts`.

## Comandos
```bash
npm install
node scripts/gen-sfx.mjs && node scripts/gen-track.mjs   # regenera trilha e SFX
npm run studio                                            # pré-visualização
npm run render                                            # gera out/intro.mp4
```
Em ambientes sem Chrome, passe `--browser-executable=<caminho do headless_shell>`.
