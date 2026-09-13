"use client";

import { useState, useTransition } from "react";
import {
  atualizarLead,
  matricularEmCadencia,
  moverLead,
  registrarInteracao,
  removerLead,
} from "@/app/app/acoes";
import { SeloPrioridade } from "./SeloPrioridade";
import { limparUrl, linkWhatsApp, tempoRelativo } from "@/lib/format";
import {
  LEAD_STATUS_LABEL,
  LEAD_STATUS_ORDEM,
  type Cadencia,
  type LeadStatus,
  type PrioridadeRadar,
  type Projeto,
} from "@/lib/types";

export type LeadCartao = {
  id: string;
  status: LeadStatus;
  projetoId: string | null;
  observacoes: string | null;
  ultimoContatoEm: string | null;
  empresa: {
    id: string;
    nome: string;
    endereco: string | null;
    telefone: string | null;
    website: string | null;
    instagram: string | null;
    nota: number | null;
    totalAvaliacoes: number;
    prioridade: PrioridadeRadar;
  } | null;
};

const CORES_COLUNA: Record<LeadStatus, string> = {
  novo: "bg-slate-400",
  contatado: "bg-marca-500",
  respondeu: "bg-amber-400",
  fechado: "bg-acento-500",
};

export function FunilLeads({
  leadsIniciais,
  projetos,
  cadencias,
}: {
  leadsIniciais: LeadCartao[];
  projetos: Projeto[];
  cadencias: Cadencia[];
}) {
  const [leads, setLeads] = useState(leadsIniciais);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<LeadStatus | null>(null);
  const [detalhe, setDetalhe] = useState<LeadCartao | null>(null);
  const [, iniciar] = useTransition();

  function mover(leadId: string, status: LeadStatus) {
    setLeads((atual) =>
      atual.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)),
    );
    iniciar(async () => {
      await moverLead(leadId, status);
    });
  }

  function aoSoltar(status: LeadStatus) {
    if (arrastando) {
      const lead = leads.find((l) => l.id === arrastando);
      if (lead && lead.status !== status) mover(arrastando, status);
    }
    setArrastando(null);
    setColunaAlvo(null);
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-4">
        {LEAD_STATUS_ORDEM.map((status) => {
          const daColuna = leads.filter((lead) => lead.status === status);
          const destacada = colunaAlvo === status;

          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setColunaAlvo(status);
              }}
              onDragLeave={() => setColunaAlvo((atual) => (atual === status ? null : atual))}
              onDrop={() => aoSoltar(status)}
              className={`rounded-2xl border p-3 transition ${
                destacada ? "border-marca-400 bg-marca-50" : "border-slate-200 bg-slate-100/70"
              }`}
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 rounded-full ${CORES_COLUNA[status]}`} />
                <h2 className="text-sm font-bold text-slate-700">{LEAD_STATUS_LABEL[status]}</h2>
                <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">
                  {daColuna.length}
                </span>
              </header>

              <ul className="space-y-2.5">
                {daColuna.map((lead) => (
                  <li
                    key={lead.id}
                    draggable
                    onDragStart={() => setArrastando(lead.id)}
                    onDragEnd={() => {
                      setArrastando(null);
                      setColunaAlvo(null);
                    }}
                    className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                      arrastando === lead.id ? "opacity-50" : "hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setDetalhe(lead)}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-semibold leading-snug text-slate-900">
                        {lead.empresa?.nome ?? "Empresa removida"}
                      </p>
                      {lead.empresa && (
                        <p className="mt-1 truncate text-xs text-slate-500">
                          {lead.empresa.website
                            ? limparUrl(lead.empresa.website)
                            : "Sem site"}
                          {lead.empresa.telefone ? ` · ${lead.empresa.telefone}` : ""}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {lead.empresa && <SeloPrioridade prioridade={lead.empresa.prioridade} />}
                        {lead.ultimoContatoEm && (
                          <span className="text-[11px] text-slate-400">
                            {tempoRelativo(lead.ultimoContatoEm)}
                          </span>
                        )}
                      </div>
                    </button>

                    <div className="mt-2.5 flex gap-1.5 border-t border-slate-100 pt-2.5">
                      {LEAD_STATUS_ORDEM.filter((s) => s !== lead.status).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => mover(lead.id, s)}
                          className="rounded-md bg-slate-100 px-1.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-200"
                          title={`Mover para ${LEAD_STATUS_LABEL[s]}`}
                        >
                          {LEAD_STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}

                {daColuna.length === 0 && (
                  <li className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400">
                    Arraste um lead para cá
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {detalhe && (
        <DetalheLead
          lead={detalhe}
          projetos={projetos}
          cadencias={cadencias}
          aoFechar={() => setDetalhe(null)}
          aoRemover={(id) => {
            setLeads((atual) => atual.filter((l) => l.id !== id));
            setDetalhe(null);
          }}
          aoAtualizar={(atualizado) => {
            setLeads((atual) => atual.map((l) => (l.id === atualizado.id ? atualizado : l)));
            setDetalhe(atualizado);
          }}
        />
      )}
    </>
  );
}

function DetalheLead({
  lead,
  projetos,
  cadencias,
  aoFechar,
  aoRemover,
  aoAtualizar,
}: {
  lead: LeadCartao;
  projetos: Projeto[];
  cadencias: Cadencia[];
  aoFechar: () => void;
  aoRemover: (id: string) => void;
  aoAtualizar: (lead: LeadCartao) => void;
}) {
  const [observacoes, setObservacoes] = useState(lead.observacoes ?? "");
  const [projetoId, setProjetoId] = useState(lead.projetoId ?? "");
  const [cadenciaId, setCadenciaId] = useState(cadencias[0]?.id ?? "");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const whatsapp = linkWhatsApp(lead.empresa?.telefone);

  function salvar() {
    setMensagem(null);
    iniciar(async () => {
      const dados = new FormData();
      dados.set("id", lead.id);
      dados.set("observacoes", observacoes);
      dados.set("projeto_id", projetoId);
      const resposta = await atualizarLead(dados);
      setMensagem(resposta.ok ? "Salvo." : (resposta.erro ?? "Erro ao salvar."));
      if (resposta.ok) {
        aoAtualizar({ ...lead, observacoes: observacoes || null, projetoId: projetoId || null });
      }
    });
  }

  function colocarNaCadencia() {
    if (!cadenciaId) return;
    setMensagem(null);
    iniciar(async () => {
      const resposta = await matricularEmCadencia(lead.id, cadenciaId);
      setMensagem(
        resposta.ok
          ? "Cadência iniciada! Os follow-ups já estão agendados."
          : (resposta.erro ?? "Não foi possível iniciar a cadência."),
      );
    });
  }

  function marcarContato() {
    iniciar(async () => {
      await registrarInteracao(lead.id, "Contato registrado manualmente", "outro");
      setMensagem("Contato registrado.");
    });
  }

  function remover() {
    iniciar(async () => {
      const resposta = await removerLead(lead.id);
      if (resposta.ok) aoRemover(lead.id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        onClick={aoFechar}
        aria-label="Fechar"
      />
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {lead.empresa?.nome ?? "Empresa removida"}
            </h2>
            {lead.empresa?.endereco && (
              <p className="mt-1 text-sm text-slate-600">{lead.empresa.endereco}</p>
            )}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
            aria-label="Fechar"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {lead.empresa && (
          <div className="mt-4 flex flex-wrap gap-2">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="botao-secundario !px-3 !py-1.5 !text-xs">
                WhatsApp
              </a>
            )}
            {lead.empresa.website && (
              <a
                href={lead.empresa.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="botao-secundario !px-3 !py-1.5 !text-xs"
              >
                Abrir site
              </a>
            )}
            {lead.empresa.instagram && (
              <a
                href={lead.empresa.instagram}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="botao-secundario !px-3 !py-1.5 !text-xs"
              >
                Instagram
              </a>
            )}
            <button type="button" onClick={marcarContato} className="botao-secundario !px-3 !py-1.5 !text-xs">
              Registrar contato
            </button>
          </div>
        )}

        <div className="mt-5 space-y-4">
          {cadencias.length > 0 && (
            <div>
              <label className="rotulo" htmlFor="cadencia-lead">
                Colocar em uma cadência
              </label>
              <div className="flex gap-2">
                <select
                  id="cadencia-lead"
                  className="campo"
                  value={cadenciaId}
                  onChange={(e) => setCadenciaId(e.target.value)}
                >
                  {cadencias.map((cadencia) => (
                    <option key={cadencia.id} value={cadencia.id}>
                      {cadencia.nome}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={colocarNaCadencia}
                  disabled={pendente}
                  className="botao-primario shrink-0 !px-3 !py-2 !text-xs"
                >
                  Iniciar
                </button>
              </div>
            </div>
          )}

          {projetos.length > 0 && (
            <div>
              <label className="rotulo" htmlFor="projeto-lead">
                Projeto
              </label>
              <select
                id="projeto-lead"
                className="campo"
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
              >
                <option value="">Sem projeto</option>
                {projetos.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="rotulo" htmlFor="observacoes-lead">
              Observações
            </label>
            <textarea
              id="observacoes-lead"
              className="campo min-h-24"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="O que foi conversado, próximo passo, objeções…"
            />
          </div>
        </div>

        {mensagem && (
          <p className="mt-4 rounded-lg bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700" role="status">
            {mensagem}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={remover}
            disabled={pendente}
            className="text-sm font-medium text-rose-600 hover:underline"
          >
            Remover do funil
          </button>
          <button type="button" onClick={salvar} disabled={pendente} className="botao-primario !px-4 !py-2 !text-sm">
            {pendente ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
