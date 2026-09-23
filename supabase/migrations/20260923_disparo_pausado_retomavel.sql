-- Disparo pausado passa a contar como ativo.
--
-- Antes, qualquer queda de conexao pausava o disparo de forma definitiva: o
-- servidor avisava "caiu", o app marcava pausado e nada nunca retomava. O
-- usuario clicava em "Comecar disparo" de novo e criava outro por cima. Deu
-- quatro disparos pausados no mesmo usuario, com 17 leads enfileirados quatro
-- vezes — quatro mensagens identicas para a mesma pessoa.

-- 1. Cancela os pausados antigos, mantendo so o mais recente de cada usuario.
with ranqueados as (
  select id, row_number() over (partition by user_id order by criado_em desc) as posicao
  from public.disparos
  where estado = 'pausado'
)
update public.disparos d
   set estado = 'cancelado', atualizado_em = now()
  from ranqueados r
 where d.id = r.id
   and r.posicao > 1;

-- 2. O indice passa a cobrir 'pausado', entao o banco recusa o segundo
--    disparo ativo mesmo que a rota deixe passar.
drop index if exists public.disparos_um_ativo_idx;
create unique index disparos_um_ativo_idx
  on public.disparos (user_id)
  where estado in ('pendente', 'rodando', 'pausado');
