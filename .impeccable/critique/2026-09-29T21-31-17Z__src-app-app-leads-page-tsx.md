---
target: /app/leads
total_score: 16
max_score: 40
na_heuristics: 
p0_count: 3
p1_count: 2
target_identity: "file:/home/user/playwright-mcp-example/src/app/app/leads/page.tsx"
target_fingerprint: "sha256:6f74a192f82ff8e41938895d6db896d39c2ef708581aafab7e300cf3c5473502"
target_path: /home/user/playwright-mcp-example/src/app/app/leads/page.tsx
timestamp: 2026-09-29T21-31-17Z
slug: src-app-app-leads-page-tsx
---
Método: dual-agent (A: revisão de design · B: detector + navegador)

## Design Health Score — 16/40 (Ruim)

| # | Heurística | Nota | Achado |
|---|---|---|---|
| 1 | Visibilidade do estado | 2 | Mover um lead não dava retorno; o resultado da ação era descartado |
| 2 | Linguagem do mundo real | 2 | Quatro nomes para um evento: coluna "Contatado", selo "Enviada", botão "Registrar contato", campo contatado_fila_em |
| 3 | Controle e liberdade | 1 | Nenhum desfazer; mover/remover/bloquear/cadência com um toque sem confirmação |
| 4 | Consistência | 1 | Âmbar = "enviada" + coluna "respondeu" + prioridade "média-alta"; verde = "fechado" + "enviar" |
| 5 | Prevenção de erro | 1 | Toda falha termina com empresa real recebendo mensagem indevida ou repetida |
| 6 | Reconhecer vs lembrar | 2 | No celular o estágio era só a posição do scroll |
| 7 | Flexibilidade | 1 | 150 leads sem busca/ordenação/filtro; seleção múltipla só excluía |
| 8 | Minimalismo | 2 | ~450px de cabeçalho antes do primeiro cartão no celular |
| 9 | Recuperação de erro | 2 | mover/remover/marcarContato engoliam o erro; marcarContato mentia |
| 10 | Ajuda | 2 | A ajuda documentava uma interação impossível no aparelho principal |

## Especificidade

Genérico com três peças próprias (PainelEnvioFunil, "Pediu para não receber", status derivado). O posicionamento do produto — ordenar por necessidade — era descartado: o funil ordenava por posicao/criado_em e nem consultava score_radar.

Detector: varredura estática dos 4 arquivos = 0 achados; da página renderizada = 33 (28 undersized-ui-text, 4 text-overflow, 1 overused-font). Estático não via nada do que a tela mostrava.

## Problemas por prioridade

- [P0-1] Arrastar não existe no toque; alternativa eram pastilhas de 23px (medido).
- [P0-2] "Pediu para não receber": irreversível, sem confirmação, no centro do rodapé da folha — zona de toque acidental.
- [P0-3] Leva ao disparo sem falar de risco; "Devolver N para a fila" reenfileira quem já recebeu; botão de WhatsApp da ficha não marca contato; linkWhatsApp prefixava "55" em qualquer número sem DDI.
- [P1-4] Cor sem significado confiável; contraste reprovado em 2,63:1 (horário) e 4,39:1 ("Marcar todos"); nenhum controle do funil tinha estilo de foco próprio.
- [P1-5] Sem busca, ordenação ou filtro; seleção múltipla só excluía.

## Personas

Casey (celular, uma mão): alvos de 23px, checkbox 16x16, barra sticky escondida atrás do cabeçalho, observações perdidas ao tocar no fundo, "Respondeu" a milhares de pixels.
Sam (teclado/leitor): folha sem role=dialog, sem armadilha de foco, sem Escape; botões de mover sem verbo. Todos os 34 controles alcançáveis por Tab (medido).
Riley (estresse): mover descartava o resultado; marcarContato sempre dizia sucesso; erro e sucesso renderizavam idênticos.
