-- Numero sem WhatsApp precisa sair da fila.
--
-- Antes, um item "pulado" nao mexia na empresa: so 'enviado' gravava
-- contatado_fila_em. O lead continuava elegivel e, como a fila e ordenada por
-- score, os mesmos numeros mortos voltavam ao topo de todo disparo novo —
-- cada rodada comecava queimando os mesmos, e parecia que o disparo nao
-- estava fazendo nada.

alter table public.empresas
  add column if not exists whatsapp_invalido_em timestamptz;

comment on column public.empresas.whatsapp_invalido_em is
  'Quando o WhatsApp respondeu que este numero nao existe. Fica fora das filas.';

-- Marca o que ja foi descoberto nas rodadas anteriores.
update public.empresas e
   set whatsapp_invalido_em = now()
 where whatsapp_invalido_em is null
   and exists (
     select 1 from public.disparo_itens i
      where i.empresa_id = e.id and i.estado = 'pulado'
   );

create index if not exists empresas_fila_idx
  on public.empresas (user_id, score_radar desc)
  where contatado_fila_em is null and whatsapp_invalido_em is null;
