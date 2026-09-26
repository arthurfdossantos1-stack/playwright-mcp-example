-- Lista de nao perturbe (LGPD art. 18: oposicao e eliminacao).
--
-- Sem isto, o ciclo era: a pessoa pede para sair, o usuario apaga o lead, a
-- proxima busca traz o mesmo telefone de volta do Google, e ela recebe outra
-- mensagem. Apagar o lead nunca foi suficiente — o que precisa persistir e a
-- recusa, nao a ficha.

create table if not exists public.bloqueios (
  id            uuid primary key default gen_random_uuid(),
  telefone_e164 text not null,
  -- 'titular' = a propria pessoa pediu, pela pagina publica.
  -- 'usuario'  = o operador marcou na mao, depois de um pedido por mensagem.
  origem        text not null default 'titular',
  user_id       uuid references auth.users (id) on delete set null,
  motivo        text,
  criado_em     timestamptz not null default now()
);

-- Um telefone so precisa constar uma vez. O bloqueio vale para a plataforma
-- inteira de proposito: quem pediu para nao ser incomodado nao deveria ter
-- que pedir de novo para cada operador.
create unique index if not exists bloqueios_telefone_idx
  on public.bloqueios (telefone_e164);

alter table public.empresas
  add column if not exists bloqueado_em timestamptz;

comment on column public.empresas.bloqueado_em is
  'Quando o titular pediu para nao receber contato. Fica fora de toda fila.';

/**
 * Bloqueio tem que valer AGORA, nao na proxima busca.
 *
 * Marca as empresas ja gravadas e tira da fila o que ainda nao saiu. Sem a
 * segunda parte, alguem que pedisse para sair no meio de um disparo ainda
 * receberia a mensagem que ja estava enfileirada.
 */
create or replace function public.aplicar_bloqueio() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.empresas
     set bloqueado_em = now()
   where whatsapp_e164 = new.telefone_e164;

  update public.disparo_itens
     set estado = 'pulado', motivo = 'pediu para nao receber'
   where numero = new.telefone_e164 and estado = 'pendente';

  return new;
end $$;

drop trigger if exists bloqueios_aplicar on public.bloqueios;
create trigger bloqueios_aplicar after insert on public.bloqueios
  for each row execute function public.aplicar_bloqueio();

alter table public.bloqueios enable row level security;

-- Leitura e escrita so para quem esta logado; a pagina publica passa pela
-- rota de servidor, que usa a chave administrativa.
drop policy if exists bloqueios_ler on public.bloqueios;
create policy bloqueios_ler on public.bloqueios
  for select to authenticated using (true);

drop policy if exists bloqueios_inserir on public.bloqueios;
create policy bloqueios_inserir on public.bloqueios
  for insert to authenticated with check (true);

-- Aceite dos termos: a data e a versao sao a prova de que houve consentimento
-- informado. Texto no rodape do formulario nao prova nada.
alter table public.profiles
  add column if not exists termos_aceitos_em timestamptz,
  add column if not exists termos_versao     text;

-- O aceite chega como metadado no cadastro; o trigger copia para o perfil.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, nome, avatar_url, termos_aceitos_em, termos_versao)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    (new.raw_user_meta_data ->> 'termos_aceitos_em')::timestamptz,
    new.raw_user_meta_data ->> 'termos_versao'
  )
  on conflict (id) do update
    set email = excluded.email,
        termos_aceitos_em = coalesce(public.profiles.termos_aceitos_em, excluded.termos_aceitos_em),
        termos_versao = coalesce(public.profiles.termos_versao, excluded.termos_versao),
        atualizado_em = now();
  return new;
end $$;
