import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import {
  ConexaoGoogle,
  FormularioPerfil,
  FormularioSenha,
} from "@/components/app/FormulariosConta";
import { Autenticacao2Etapas } from "@/components/app/Autenticacao2Etapas";
import { formatarData } from "@/lib/format";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaConfiguracoes() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("profiles")
    .select("nome, email, criado_em")
    .eq("id", user!.id)
    .maybeSingle();

  const identidades = user?.identities ?? [];
  const temGoogle = identidades.some((identidade) => identidade.provider === "google");

  return (
    <>
      <CabecalhoPagina
        titulo="Configurações"
        descricao="Dados da conta, senha e conexão com o Google."
      />

      <div className="cartao mb-5 flex flex-wrap items-center justify-between gap-4 border-acento-500/30 bg-acento-500/5 p-5">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Acesso completo e ilimitado</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Sua conta tem todos os recursos liberados: varreduras, Radar, templates, cadências,
            funil e projetos — sem limite de uso e sem cobrança.
          </p>
        </div>
        <span className="rounded-full bg-acento-500/15 px-3 py-1.5 text-xs font-bold text-acento-600">
          Conta gratuita
        </span>
      </div>

      <div className="space-y-5">
        <Autenticacao2Etapas />

        <div className="cartao p-6">
          <h2 className="text-sm font-bold text-slate-900">Identificação</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</dt>
              <dd className="mt-1 text-sm text-slate-900">{perfil?.email ?? user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conta criada em
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {formatarData(perfil?.criado_em ?? user?.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Forma de acesso
              </dt>
              <dd className="mt-1 text-sm text-slate-900">
                {identidades.map((i) => i.provider).join(", ") || "e-mail"}
              </dd>
            </div>
          </dl>
        </div>

        <FormularioPerfil nomeInicial={perfil?.nome ?? ""} />
        <ConexaoGoogle conectado={temGoogle} />
        <FormularioSenha />

        <div className="cartao p-6">
          <h2 className="text-sm font-bold text-slate-900">Seus dados</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Tudo o que você cria fica isolado na sua conta pelo Row Level Security do banco. Para
            exportar ou excluir seus dados, fale com a gente — veja o que guardamos e por quanto
            tempo na{" "}
            <Link href="/privacidade" className="font-medium text-marca-700 hover:underline">
              política de privacidade
            </Link>
            .
          </p>
          <a
            href="mailto:contato@rastrolead.com.br?subject=Meus%20dados%20no%20RastroLead"
            className="botao-secundario mt-4 !px-4 !py-2 !text-sm"
          >
            Solicitar exportação ou exclusão
          </a>
        </div>
      </div>
    </>
  );
}
