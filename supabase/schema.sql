-- ===========================================================================
-- RastroLead - esquema de banco (Supabase / Postgres)
-- ---------------------------------------------------------------------------
-- Versao 100% gratuita: NAO existem tabelas de planos, assinaturas, cobranca,
-- creditos ou contador de uso mensal. Todo usuario autenticado tem acesso
-- ilimitado a buscas, empresas, templates, cadencias e projetos.
-- A unica tabela de controle e `rate_limit_eventos`, que protege a cota da
-- Google Places API contra abuso e nunca e exposta na interface.
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type lead_status as enum ('novo', 'contatado', 'respondeu', 'fechado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prioridade_radar as enum ('alta', 'media_alta', 'media', 'baixa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type busca_status as enum ('processando', 'concluida', 'erro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type canal_contato as enum ('whatsapp', 'email', 'instagram', 'telefone', 'outro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type cadencia_lead_status as enum ('ativa', 'pausada', 'concluida', 'cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type follow_up_status as enum ('pendente', 'pronto', 'enviado', 'cancelado');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles: espelho de auth.users. Toda conta nasce com acesso completo.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  nome         text,
  avatar_url   text,
  criado_em    timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projetos: agrupa buscas e leads por cliente/campanha (liberado para todos)
-- ---------------------------------------------------------------------------
create table if not exists public.projetos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  nome       text not null,
  descricao  text,
  cor        text not null default '#2563eb',
  arquivado  boolean not null default false,
  criado_em  timestamptz not null default now()
);
create index if not exists projetos_user_idx on public.projetos (user_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- buscas: cada varredura "nicho + cidade" disparada na Google Places API
-- ---------------------------------------------------------------------------
create table if not exists public.buscas (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  projeto_id      uuid references public.projetos (id) on delete set null,
  nicho           text not null,
  cidade          text not null,
  termo           text not null,
  status          busca_status not null default 'processando',
  total_resultados integer not null default 0,
  erro            text,
  criado_em       timestamptz not null default now(),
  concluido_em    timestamptz
);
create index if not exists buscas_user_idx on public.buscas (user_id, criado_em desc);
create index if not exists buscas_projeto_idx on public.buscas (projeto_id);

-- ---------------------------------------------------------------------------
-- empresas: resultado de uma varredura, ja com a prioridade do Radar
-- ---------------------------------------------------------------------------
create table if not exists public.empresas (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  busca_id          uuid not null references public.buscas (id) on delete cascade,
  place_id          text not null,
  nome              text not null,
  endereco          text,
  telefone          text,
  website           text,
  instagram         text,
  categoria         text,
  nota              numeric(2,1),
  total_avaliacoes  integer not null default 0,
  latitude          double precision,
  longitude         double precision,
  google_maps_url   text,
  prioridade        prioridade_radar not null default 'baixa',
  score_radar       integer not null default 0,
  motivos_radar     jsonb not null default '[]'::jsonb,
  criado_em         timestamptz not null default now(),
  unique (busca_id, place_id)
);
create index if not exists empresas_user_idx on public.empresas (user_id, criado_em desc);
create index if not exists empresas_busca_idx on public.empresas (busca_id);
create index if not exists empresas_prioridade_idx on public.empresas (user_id, prioridade);

-- ---------------------------------------------------------------------------
-- leads: empresas selecionadas e movidas pelo funil
-- ---------------------------------------------------------------------------
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  projeto_id       uuid references public.projetos (id) on delete set null,
  status           lead_status not null default 'novo',
  posicao          integer not null default 0,
  observacoes      text,
  ultimo_contato_em timestamptz,
  criado_em        timestamptz not null default now(),
  atualizado_em    timestamptz not null default now(),
  unique (user_id, empresa_id)
);
create index if not exists leads_user_status_idx on public.leads (user_id, status, posicao);
create index if not exists leads_projeto_idx on public.leads (projeto_id);

-- ---------------------------------------------------------------------------
-- templates: mensagens com variaveis {{empresa}}, {{cidade}}, {{nicho}}
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  nome          text not null,
  canal         canal_contato not null default 'whatsapp',
  assunto       text,
  corpo         text not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists templates_user_idx on public.templates (user_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- cadencias e etapas: sequencias de follow-up (dia 0, dia 3, dia 7, ...)
-- ---------------------------------------------------------------------------
create table if not exists public.cadencias (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  nome      text not null,
  descricao text,
  ativa     boolean not null default true,
  criado_em timestamptz not null default now()
);
create index if not exists cadencias_user_idx on public.cadencias (user_id, criado_em desc);

create table if not exists public.cadencia_etapas (
  id          uuid primary key default gen_random_uuid(),
  cadencia_id uuid not null references public.cadencias (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  ordem       integer not null default 1,
  dia_offset  integer not null default 0,
  canal       canal_contato not null default 'whatsapp',
  template_id uuid references public.templates (id) on delete set null,
  titulo      text,
  criado_em   timestamptz not null default now()
);
create index if not exists etapas_cadencia_idx on public.cadencia_etapas (cadencia_id, ordem);

-- ---------------------------------------------------------------------------
-- lead_cadencias: matricula de um lead em uma cadencia
-- ---------------------------------------------------------------------------
create table if not exists public.lead_cadencias (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  lead_id     uuid not null references public.leads (id) on delete cascade,
  cadencia_id uuid not null references public.cadencias (id) on delete cascade,
  status      cadencia_lead_status not null default 'ativa',
  iniciada_em timestamptz not null default now(),
  encerrada_em timestamptz,
  unique (lead_id, cadencia_id)
);
create index if not exists lead_cadencias_user_idx on public.lead_cadencias (user_id, status);

-- ---------------------------------------------------------------------------
-- follow_ups: tarefas agendadas e executadas pelo worker/cron
-- ---------------------------------------------------------------------------
create table if not exists public.follow_ups (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  lead_id          uuid not null references public.leads (id) on delete cascade,
  lead_cadencia_id uuid references public.lead_cadencias (id) on delete cascade,
  etapa_id         uuid references public.cadencia_etapas (id) on delete set null,
  canal            canal_contato not null default 'whatsapp',
  agendado_para    timestamptz not null,
  status           follow_up_status not null default 'pendente',
  mensagem         text,
  executado_em     timestamptz,
  criado_em        timestamptz not null default now()
);
create index if not exists follow_ups_due_idx on public.follow_ups (status, agendado_para);
create index if not exists follow_ups_user_idx on public.follow_ups (user_id, agendado_para);

-- ---------------------------------------------------------------------------
-- interacoes: historico de contato com o lead
-- ---------------------------------------------------------------------------
create table if not exists public.interacoes (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users (id) on delete cascade,
  lead_id   uuid not null references public.leads (id) on delete cascade,
  canal     canal_contato not null default 'outro',
  titulo    text not null,
  conteudo  text,
  criado_em timestamptz not null default now()
);
create index if not exists interacoes_lead_idx on public.interacoes (lead_id, criado_em desc);

-- ---------------------------------------------------------------------------
-- rate_limit_eventos: controle TECNICO por usuario/IP.
-- Nao e um plano, nao aparece na interface e nao limita o que o usuario pode
-- fazer no produto: apenas evita rajadas que estourariam a cota do Google.
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limit_eventos (
  id        bigserial primary key,
  chave     text not null,
  criado_em timestamptz not null default now()
);
create index if not exists rate_limit_chave_idx on public.rate_limit_eventos (chave, criado_em desc);

create or replace function public.checar_rate_limit(
  p_chave text,
  p_limite integer,
  p_janela_segundos integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  delete from public.rate_limit_eventos
   where criado_em < now() - make_interval(secs => greatest(p_janela_segundos, 60) * 10);

  select count(*) into v_total
    from public.rate_limit_eventos
   where chave = p_chave
     and criado_em > now() - make_interval(secs => p_janela_segundos);

  if v_total >= p_limite then
    return false;
  end if;

  insert into public.rate_limit_eventos (chave) values (p_chave);
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: cria o profile assim que a conta e criada.
-- Acesso completo e imediato - sem escolha de plano, sem pagamento.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nome, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Trigger: mantem atualizado_em
-- ---------------------------------------------------------------------------
create or replace function public.tocar_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.tocar_atualizado_em();

-- ---------------------------------------------------------------------------
-- Row Level Security: cada usuario enxerga apenas os proprios dados.
-- ---------------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.projetos          enable row level security;
alter table public.buscas            enable row level security;
alter table public.empresas          enable row level security;
alter table public.leads             enable row level security;
alter table public.templates         enable row level security;
alter table public.cadencias         enable row level security;
alter table public.cadencia_etapas   enable row level security;
alter table public.lead_cadencias    enable row level security;
alter table public.follow_ups        enable row level security;
alter table public.interacoes        enable row level security;
alter table public.rate_limit_eventos enable row level security;

-- Nota: as politicas usam (select auth.uid()) em vez de auth.uid() puro.
-- E a forma recomendada pelo Supabase para RLS: o valor e resolvido uma vez
-- por consulta, nao reavaliado a cada linha (ver advisor auth_rls_initplan).
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'projetos','buscas','empresas','leads','templates',
    'cadencias','cadencia_etapas','lead_cadencias','follow_ups','interacoes'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_owner', t
    );
  end loop;
end $$;

-- rate_limit_eventos so e manipulada pela funcao security definer / service role.
drop policy if exists "rate_limit_sem_acesso" on public.rate_limit_eventos;
create policy "rate_limit_sem_acesso" on public.rate_limit_eventos
  for select using (false);

-- ---------------------------------------------------------------------------
-- Funcoes internas nao devem ser chamaveis livremente via REST.
-- handle_new_user roda apenas pelo trigger (nao precisa de EXECUTE explicito
-- para isso); checar_rate_limit so faz sentido para quem ja esta logado.
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.checar_rate_limit(text, integer, integer) from public, anon;
grant execute on function public.checar_rate_limit(text, integer, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Indices cobrindo foreign keys (evita sequential scan em joins comuns)
-- ---------------------------------------------------------------------------
create index if not exists cadencia_etapas_template_id_idx on public.cadencia_etapas (template_id);
create index if not exists cadencia_etapas_user_id_idx on public.cadencia_etapas (user_id);
create index if not exists follow_ups_etapa_id_idx on public.follow_ups (etapa_id);
create index if not exists follow_ups_lead_cadencia_id_idx on public.follow_ups (lead_cadencia_id);
create index if not exists follow_ups_lead_id_idx on public.follow_ups (lead_id);
create index if not exists interacoes_user_id_idx on public.interacoes (user_id);
create index if not exists lead_cadencias_cadencia_id_idx on public.lead_cadencias (cadencia_id);
create index if not exists leads_empresa_id_idx on public.leads (empresa_id);

-- ---------------------------------------------------------------------------
-- View de apoio: leads "intocados" (ainda nao movidos do funil)
-- ---------------------------------------------------------------------------
create or replace view public.empresas_radar
with (security_invoker = true) as
select
  e.*,
  (l.id is null) as intocado,
  l.status as lead_status,
  l.id as lead_id
from public.empresas e
left join public.leads l
  on l.empresa_id = e.id and l.user_id = e.user_id;
