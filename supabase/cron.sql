-- ===========================================================================
-- RastroLead - agendamento do worker de follow-up
-- ---------------------------------------------------------------------------
-- Roda de 15 em 15 minutos e marca como "pronto" todo follow-up vencido,
-- registrando a interacao no historico do lead e avancando a cadencia.
--
-- Ha duas formas de rodar. Escolha UMA:
--   A) pg_cron chamando direto a funcao SQL (mais simples, nao sai do banco)
--   B) pg_cron + pg_net chamando a Edge Function / rota /api/cron/follow-ups
-- ===========================================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- ---------------------------------------------------------------------------
-- Funcao que dispara os follow-ups vencidos (usada pela opcao A e tambem
-- chamada pela Edge Function na opcao B).
-- ---------------------------------------------------------------------------
create or replace function public.disparar_follow_ups_vencidos()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  r record;
begin
  for r in
    select f.*, l.id as l_id
      from public.follow_ups f
      join public.leads l on l.id = f.lead_id
     where f.status = 'pendente'
       and f.agendado_para <= now()
     order by f.agendado_para asc
     limit 500
  loop
    update public.follow_ups
       set status = 'pronto'
     where id = r.id;

    insert into public.interacoes (user_id, lead_id, canal, titulo, conteudo)
    values (
      r.user_id,
      r.lead_id,
      r.canal,
      'Follow-up da cadencia ficou pronto para envio',
      r.mensagem
    );

    v_total := v_total + 1;
  end loop;

  -- Encerra as matriculas que ja nao tem follow-up pendente.
  update public.lead_cadencias lc
     set status = 'concluida',
         encerrada_em = now()
   where lc.status = 'ativa'
     and not exists (
       select 1 from public.follow_ups f
        where f.lead_cadencia_id = lc.id
          and f.status = 'pendente'
     );

  return v_total;
end;
$$;

-- ---------------------------------------------------------------------------
-- Opcao A: pg_cron chama a funcao diretamente
-- ---------------------------------------------------------------------------
select cron.unschedule('rastrolead-follow-ups')
 where exists (select 1 from cron.job where jobname = 'rastrolead-follow-ups');

select cron.schedule(
  'rastrolead-follow-ups',
  '*/15 * * * *',
  $$ select public.disparar_follow_ups_vencidos(); $$
);

-- ---------------------------------------------------------------------------
-- Opcao B: pg_cron + pg_net chamando a Edge Function (ou /api/cron/follow-ups)
-- Troque a URL e o segredo antes de rodar.
-- ---------------------------------------------------------------------------
-- select cron.schedule(
--   'rastrolead-follow-ups-http',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url     := 'https://SEU-PROJETO.supabase.co/functions/v1/follow-ups',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer SUA-SERVICE-ROLE-KEY'
--     ),
--     body    := '{}'::jsonb
--   );
--   $$
-- );
