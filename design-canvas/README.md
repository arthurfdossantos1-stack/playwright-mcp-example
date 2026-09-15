# Eletro Power 380 — canvas do Claude Design

Mesma página de `site/`, no formato `.dc.html` para continuar editável no canvas
do Claude Design.

```
design-canvas/
├── Eletro Power 380.dc.html    a página (marcação + lógica do canvas)
├── support.js                  runtime do canvas
├── image-slot.js               componente de slot de imagem
└── assets/                     cópia de site/assets (CSS e imagens)
```

O que muda em relação ao `site/index.html`:

- **Fotos são `<image-slot>`**: arraste a foto da obra para cima do slot no
  canvas e ela substitui a ilustração técnica, sem mexer no código.
- **Links do WhatsApp vêm de props**: o número está na prop `whatsapp`
  (seção "Contato" do painel). Trocar ali atualiza os 18 links e o `tel:`,
  inclusive o telefone formatado que aparece como texto.
- **Dois blocos são opcionais**: `plantaoStrip` (barra de plantão no topo) e
  `showFloating` (botão flutuante do WhatsApp), ligáveis pelo painel.

As duas versões compartilham `assets/css/styles.css`. Ao alterar o design,
edite o CSS em `site/assets/css/styles.css` e copie a pasta `assets` para cá
para manter as duas em sincronia.
