# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Desenvolvedores de sites que prospectam sozinhos os próprios clientes — quem
vende site e presença digital para pequenos negócios e precisa achar quem
comprar. Produto público: qualquer um cria conta e usa.

O usuário trabalha **do celular**. Ele busca, avalia e manda mensagem entre
uma tarefa e outra, muitas vezes com o WhatsApp aberto do lado. Quando liga o
disparo automático, o servidor roda no próprio aparelho, pelo Termux.

## Product Purpose

Transformar uma busca por **nicho + cidade** numa conversa no WhatsApp.

O usuário informa o que procura ("vidraceiro em Florianópolis"), o app reúne
as empresas a partir do Google Places e do Instagram, pontua cada uma, e
organiza a abordagem num funil até o fechamento. Sucesso é o usuário sair da
busca com conversas abertas, não com uma lista.

## Positioning

O **Radar** pontua pela *ausência* de presença digital, não pelo tamanho do
negócio. Empresa sem site, com poucas avaliações ou com Instagram parado sobe
na lista — porque é exatamente quem precisa do serviço que o usuário vende.

Uma ferramenta de leads vizinha vende volume e ordena por relevância ou por
proximidade. Esta ordena por **necessidade**, e é a única afirmação aqui que
um concorrente não copiaria sem mudar o produto dele.

## Operating Context

- **Celular em primeiro lugar.** A maior parte do uso é em tela pequena, com o
  usuário alternando entre o app e o WhatsApp.
- **Dois caminhos de envio.** Manual, pela fila (abre o `wa.me` já escrito), e
  automático, por um servidor que o usuário roda no próprio celular via
  Termux e conecta por QR Code.
- **Chip descartável.** O disparo automático usa uma conexão não oficial com o
  WhatsApp. A orientação em tela é sempre conectar um número separado.
- **Aquecimento.** O teto de envios começa baixo e sobe por dia. Volume alto
  em número novo é o caminho curto para o banimento.

## Capabilities and Constraints

- Busca por Google Places e Instagram (Apify), por cidade ou país inteiro.
  Países atendidos: BR, PT, ES, US, MX, AR.
- Radar com score e prioridade; funil de leads; templates; cadências e
  follow-ups; prévia de site gerada com Gemini.
- **Gratuito, sem planos.** Não existe cobrança, tabela de preços nem tela de
  pagamento, e isso é decisão de produto, não uma etapa futura. Os limites
  que existem (`RATE_LIMIT_*`, cota diária de prévias, teto de crédito do
  Apify) são **técnicos**, para proteger cota de API.
- **Lista de não perturbe.** Quem pede para não receber entra numa lista por
  telefone que vale para a plataforma inteira, sai de qualquer disparo já
  enfileirado e não volta em buscas futuras.
- **Fixo não é celular.** Em alguns países o número não diz se é móvel ou
  fixo (México, Estados Unidos). Nesses, a lista vem com fixo no meio, e não
  há como resolver pelo número.
- Idioma: português do Brasil em toda a interface, e também no código —
  nomes de arquivo, variáveis, funções e colunas do banco.

## Brand Commitments

O nome **RastroLead** está definido e não muda.

Cores, tipografia e o resto da identidade estão em aberto: o usuário disse
explicitamente que nada além do nome é obrigatório.

## Evidence on Hand

- Base real em produção: 1.404 empresas, 150 leads, 3 templates, 3 contas.
- Não existem depoimentos, logos de clientes, números de resultado, estudos
  de caso nem imprensa. **Nenhum desses pode ser inventado** em tela.
- Não existe preço a comunicar: o produto é gratuito.

## Product Principles

1. **A busca termina numa conversa.** Toda tela é julgada por quanto aproxima
   o usuário de uma mensagem enviada, não por quanta informação mostra.
2. **Necessidade acima de volume.** O que ordena a lista é quem mais precisa
   do serviço, não quem é maior ou está mais perto.
3. **Falha silenciosa é bug.** Erro de API vira aviso na tela. O produto já
   perdeu dados duas vezes por tratar falha como resultado vazio.
4. **O risco aparece antes da ação.** Banimento de número, envio a estranho e
   custo de cota são ditos na tela onde a decisão acontece, não no rodapé.
5. **Quem pediu para sair, saiu.** A recusa de um contato vale mais que
   qualquer lista, e nenhuma busca futura a desfaz.

## Accessibility & Inclusion

Nenhum padrão formal foi estabelecido pelo usuário. O que é fato do produto:
a interface precisa funcionar bem em tela de celular e com uma das mãos,
porque é assim que ela é usada.
