-- Disparo de WhatsApp em modo "pull". JA APLICADO no banco de producao.
-- O servidor PERGUNTA ao app se tem trabalho, em vez de o app chamar ele.
-- Assim nao precisa de IP publico nem tunel, e o estado do disparo vive
-- aqui: se o processo morrer no meio, ele reabre e retoma de onde parou.

create table if not exists public.whatsapp_sessao (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  conectado     boolean not null default false,
  numero        text,
  qr            text,
  comando       text check (comando in ('conectar', 'desconectar')),
  enviadas_hoje integer not null default 0,
  teto_hoje     integer not null default 20,
  visto_em      timestamptz,
  atualizado_em timestamptz not null default now()
);

do $$ begin
  create type disparo_estado as enum ('pendente', 'rodando', 'pausado', 'concluido', 'cancelado');
exception when duplicate_object then null; end $$;

create table if not exists public.disparos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  estado        disparo_estado not null default 'pendente',
  intervalo_min integer not null default 45,
  intervalo_max integer not null default 90,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists disparos_user_idx on public.disparos (user_id, criado_em desc);
create unique index if not exists disparos_um_ativo_idx
  on public.disparos (user_id) where estado in ('pendente', 'rodando');

do $$ begin
  create type disparo_item_estado as enum ('pendente', 'enviado', 'pulado', 'falhou');
exception when duplicate_object then null; end $$;

create table if not exists public.disparo_itens (
  id          uuid primary key default gen_random_uuid(),
  disparo_id  uuid not null references public.disparos (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  empresa_id  uuid not null references public.empresas (id) on delete cascade,
  lead_id     uuid references public.leads (id) on delete set null,
  numero      text not null,
  texto       text not null,
  estado      disparo_item_estado not null default 'pendente',
  motivo      text,
  enviado_em  timestamptz,
  criado_em   timestamptz not null default now()
);
create index if not exists disparo_itens_fila_idx
  on public.disparo_itens (disparo_id, estado, criado_em);
create index if not exists disparo_itens_user_idx on public.disparo_itens (user_id);

alter table public.whatsapp_sessao enable row level security;
alter table public.disparos enable row level security;
alter table public.disparo_itens enable row level security;

do $$ begin
  create policy "dono ve e edita a propria sessao" on public.whatsapp_sessao
    for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "dono ve e edita os proprios disparos" on public.disparos
    for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "dono ve e edita os proprios itens" on public.disparo_itens
    for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
exception when duplicate_object then null; end $$;
