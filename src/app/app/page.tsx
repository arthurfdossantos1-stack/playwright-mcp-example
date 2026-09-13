import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { PainelFollowUps } from "@/components/app/PainelFollowUps";
import { BotaoConteudoInicial } from "@/components/app/BotaoConteudoInicial";
import { formatarDataHora, tempoRelativo } from "@/lib/format";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Visão geral" };

type FollowUpPainel = {
  id: string;
  agendado_para: string;
  status: string;
  canal: string;
  mensagem: string | null;
  leads: { id: string; empresas: { nome: string; telefone: string | null } | null } | null;
};

export default async function PaginaVisaoGeral() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const agora = new Date().toISOString();

  const [buscasRes, totalBuscasRes, empresasRes, leadsRes, followUpsRes, templatesRes] =
    await Promise.all([
    supabase
      .from("buscas")
      .select("id, nicho, cidade, total_resultados, status, criado_em")
      .order("criado_em", { ascending: false })
      .limit(6),
    supabase.from("buscas").select("id", { count: "exact", head: true }),
    supabase.from("empresas").select("id", { count: "exact", head: true }),
    supabase.from("leads").select("id, status"),
    supabase
      .from("follow_ups")
      .select("id, agendado_para, status, canal, mensagem, leads ( id, empresas ( nome, telefone ) )")
      .in("status", ["pendente", "pronto"])
      .lte("agendado_para", agora)
      .order("agendado_para", { ascending: true })
      .limit(12),
    supabase.from("templates").select("id", { count: "exact", head: true }),
    ]);

  const buscas = buscasRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const followUps = (followUpsRes.data ?? []) as unknown as FollowUpPainel[];
  const temTemplates = (templatesRes.count ?? 0) > 0;

  const porStatus = leads.reduce<Record<string, number>>((acumulado, lead) => {
    acumulado[lead.status] = (acumulado[lead.status] ?? 0) + 1;
    return acumulado;
  }, {});

  const nome =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "";

  return (
    <>
      <CabecalhoPagina
        titulo={nome ? `Olá, ${nome}` : "Visão geral"}
        descricao="Seu acesso é completo e ilimitado. Comece por uma varredura nova ou retome de onde parou."
        acao={
          <Link href="/app/buscar" className="botao-primario !px-4 !py-2 !text-sm">
            Nova varredura
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { valor: totalBuscasRes.count ?? 0, rotulo: "varreduras feitas", href: "/app/buscar" },
          { valor: empresasRes.count ?? 0, rotulo: "empresas encontradas", href: "/app/radar" },
          { valor: leads.length, rotulo: "leads no funil", href: "/app/leads" },
          { valor: followUps.length, rotulo: "follow-ups vencidos", href: "/app/leads" },
        ].map((kpi) => (
          <Link key={kpi.rotulo} href={kpi.href} className="cartao p-4 transition hover:shadow-md">
            <p className="text-2xl font-bold leading-none text-slate-900">{kpi.valor}</p>
            <p className="mt-1.5 text-xs text-slate-500">{kpi.rotulo}</p>
          </Link>
        ))}
      </div>

      {!temTemplates && (
        <div className="cartao mb-6 flex flex-wrap items-center justify-between gap-4 border-marca-200 bg-marca-50/60 p-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Comece com o kit pronto</h2>
            <p className="mt-1 text-sm text-slate-600">
              Criamos 4 templates de mensagem e a cadência 0 / 3 / 7 para você editar como quiser.
            </p>
          </div>
          <BotaoConteudoInicial />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Follow-ups para hoje
          </h2>
          <PainelFollowUps
            followUps={followUps.map((f) => ({
              id: f.id,
              agendadoPara: f.agendado_para,
              canal: f.canal,
              mensagem: f.mensagem,
              empresa: f.leads?.empresas?.nome ?? "Lead",
              telefone: f.leads?.empresas?.telefone ?? null,
            }))}
          />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Últimas varreduras
          </h2>

          {buscas.length === 0 ? (
            <div className="cartao px-5 py-10 text-center">
              <p className="text-sm text-slate-600">
                Você ainda não rodou nenhuma varredura. Escolha um nicho e uma cidade para começar.
              </p>
              <Link href="/app/buscar" className="botao-primario mt-5 !px-4 !py-2 !text-sm">
                Fazer a primeira varredura
              </Link>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {buscas.map((busca) => (
                <li key={busca.id}>
                  <Link
                    href={`/app/resultados/${busca.id}`}
                    className="cartao flex items-center gap-3 p-4 transition hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {busca.nicho} <span className="font-normal text-slate-500">em</span>{" "}
                        {busca.cidade}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {busca.status === "erro"
                          ? "Falhou"
                          : `${busca.total_resultados} empresas`}{" "}
                        · {tempoRelativo(busca.criado_em)}
                      </p>
                    </div>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <h2 className="mb-3 mt-8 text-sm font-bold uppercase tracking-wide text-slate-500">
            Funil
          </h2>
          <div className="cartao divide-y divide-slate-100">
            {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-slate-600">{LEAD_STATUS_LABEL[status]}</span>
                <span className="text-sm font-bold text-slate-900">{porStatus[status] ?? 0}</span>
              </div>
            ))}
          </div>
          <Link
            href="/app/leads"
            className="mt-3 block text-center text-sm font-semibold text-marca-700 hover:underline"
          >
            Abrir o funil completo →
          </Link>
        </section>
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Atualizado em {formatarDataHora(new Date())}
      </p>
    </>
  );
}
