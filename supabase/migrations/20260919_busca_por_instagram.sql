-- ===========================================================================
-- Busca por Instagram (via Apify)
-- ---------------------------------------------------------------------------
-- Aplique no SQL Editor do Supabase antes de usar a fonte "Instagram" na tela
-- de varredura. Sem estas colunas a rota /api/buscas falha ao gravar.
--
-- Tudo e aditivo e idempotente: pode rodar duas vezes sem quebrar nada, e
-- nenhuma linha existente muda de comportamento (o padrao e 'google').
-- ===========================================================================

-- Fonte da varredura: Google Places, Instagram ou as duas.
alter table public.buscas
  add column if not exists fonte text not null default 'google';

alter table public.buscas
  drop constraint if exists buscas_fonte_valida;
alter table public.buscas
  add constraint buscas_fonte_valida check (fonte in ('google', 'instagram', 'ambos'));

-- De onde veio ESTA empresa. Numa varredura "ambos" as duas origens convivem
-- na mesma busca, entao a marca precisa ficar na linha da empresa.
alter table public.empresas
  add column if not exists fonte text not null default 'google';

alter table public.empresas
  drop constraint if exists empresas_fonte_valida;
alter table public.empresas
  add constraint empresas_fonte_valida check (fonte in ('google', 'instagram'));

-- Dados que so o Instagram tem. A coluna `instagram` (URL do perfil) ja
-- existia e continua valendo para as duas origens.
alter table public.empresas
  add column if not exists instagram_username text,
  add column if not exists instagram_seguidores integer,
  add column if not exists instagram_bio text,
  -- "Tem link de site na bio?" e o sinal mais forte do Radar num lead de
  -- Instagram: perfil ativo e sem site e exatamente a oportunidade.
  add column if not exists instagram_site_na_bio boolean not null default false;

-- A cota mensal do Apify e contada por aqui: quantas empresas de origem
-- Instagram foram gravadas no ciclo. Sem este indice a checagem do teto
-- varreria a tabela inteira a cada varredura.
create index if not exists empresas_fonte_mes_idx
  on public.empresas (user_id, fonte, criado_em desc);
