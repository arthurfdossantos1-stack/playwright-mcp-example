import Link from "next/link";
import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina, EstadoVazio } from "@/components/app/Cabecalho";
import { FunilLeads, type LeadCartao } from "@/components/app/FunilLeads";
import { PainelEnvioFunil } from "@/components/app/PainelEnvioFunil";
import type { Cadencia, LeadStatus, PrioridadeRadar, Projeto } from "@/lib/types";

export const metadata: Metadata = { title: "Leads" };

type LinhaLead = {
  id: string;
  status: LeadStatus;
  projeto_id: string | null;
  observacoes: string | null;
  ultimo_contato_em: string | null;
  empresas: {
    id: string;
    nome: string;
    endereco: string | null;
    telefone: string | null;
    website: string | null;
    instagram: string | null;
    nota: number | null;
    total_avaliacoes: number;
    prioridade: PrioridadeRadar;
    contatado_fila_em: string | null;
    whatsapp_e164: string | null;
  } | null;
};

export default async function PaginaLeads({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string }>;
}) {
  const { projeto } = await searchParams;
  const supabase = await criarClienteServidor();

  let consulta = supabase
    .from("leads")
    .select(
      "id, status, projeto_id, observacoes, ultimo_contato_em, empresas ( id, nome, endereco, telefone, website, instagram, nota, total_avaliacoes, prioridade, contatado_fila_em, whatsapp_e164 )",
    )
    .order("posicao", { ascending: true })
    .order("criado_em", { ascending: false });

  if (projeto) consulta = consulta.eq("projeto_id", projeto);

  const [{ data: leads }, { data: projetos }, { data: cadencias }] = await Promise.all([
    consulta,
    supabase.from("projetos").select("*").eq("arquivado", false).order("nome"),
    supabase.from("cadencias").select("*").eq("ativa", true).order("criado_em"),
  ]);

  const cartoes: LeadCartao[] = ((leads ?? []) as unknown as LinhaLead[]).map((lead) => {
    const empresa = Array.isArray(lead.empresas) ? lead.empresas[0] : lead.empresas;
    return {
      id: lead.id,
      status: lead.status,
      projetoId: lead.projeto_id,
      observacoes: lead.observacoes,
      ultimoContatoEm: lead.ultimo_contato_em,
      empresa: empresa
        ? {
            id: empresa.id,
            nome: empresa.nome,
            endereco: empresa.endereco,
            telefone: empresa.telefone,
            website: empresa.website,
            instagram: empresa.instagram,
            nota: empresa.nota,
            contatadoFilaEm: empresa.contatado_fila_em ?? null,
            totalAvaliacoes: empresa.total_avaliacoes,
            prioridade: empresa.prioridade,
          }
        : null,
    };
  });

  // Mesmo critério da /app/enviar-mensagem, para os números baterem com o que
  // a fila realmente mostra.
  const ativos = ((leads ?? []) as unknown as LinhaLead[]).filter(
    (l) => l.status === "novo" || l.status === "contatado",
  );
  const comEmpresa = ativos
    .map((l) => (Array.isArray(l.empresas) ? l.empresas[0] : l.empresas))
    .filter((e): e is NonNullable<LinhaLead["empresas"]> => Boolean(e));

  const prontos = comEmpresa.filter((e) => e.whatsapp_e164 && !e.contatado_fila_em).length;
  const semWhatsapp = comEmpresa.filter((e) => !e.whatsapp_e164).length;
  const jaContatados = comEmpresa.filter((e) => e.whatsapp_e164 && e.contatado_fila_em).length;

  const listaProjetos = (projetos ?? []) as Projeto[];

  return (
    <>
      <CabecalhoPagina
        titulo="Funil de leads"
        descricao="Arraste os cartões entre as colunas ou use os atalhos. Clique no cartão para abrir detalhes, iniciar uma cadência e anotar o que foi conversado."
        acao={
          <Link href="/app/radar" className="botao-secundario !px-3.5 !py-2 !text-sm">
            Buscar no Radar
          </Link>
        }
      />

      {listaProjetos.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          <Link
            href="/app/leads"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              !projeto ? "bg-marca-600 text-[#ffffff]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Todos os projetos
          </Link>
          {listaProjetos.map((p) => (
            <Link
              key={p.id}
              href={`/app/leads?projeto=${p.id}`}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                projeto === p.id
                  ? "bg-marca-600 text-[#ffffff]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.nome}
            </Link>
          ))}
        </div>
      )}

      {cartoes.length > 0 && (
        <PainelEnvioFunil
          prontos={prontos}
          semWhatsapp={semWhatsapp}
          jaContatados={jaContatados}
        />
      )}

      {cartoes.length === 0 ? (
        <EstadoVazio
          titulo="Seu funil está vazio"
          descricao="Rode uma varredura, abra o Radar e envie as melhores empresas para o funil. Elas aparecem aqui na coluna Novo."
          acao={
            <Link href="/app/buscar" className="botao-primario">
              Fazer uma varredura
            </Link>
          }
        />
      ) : (
        <FunilLeads
          leadsIniciais={cartoes}
          projetos={listaProjetos}
          cadencias={(cadencias ?? []) as Cadencia[]}
        />
      )}
    </>
  );
}
