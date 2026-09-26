"use client";

import { useState, useTransition } from "react";
import {
  atualizarLead,
  matricularEmCadencia,
  bloquearContato,
  moverLead,
  registrarInteracao,
  removerLead,
  removerLeads,
} from "@/app/app/acoes";
import { SeloPrioridade } from "./SeloPrioridade";
import { SeloStatus } from "./SeloStatus";
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
    /** Marca a hora em que o wa.me foi aberto pela fila. */
    contatadoFilaEm: string | null;
    whatsappE164: string | null;
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
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function alternar(leadId: string) {
    setConfirmando(false);
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      if (!proximo.delete(leadId)) proximo.add(leadId);
      return proximo;
    });
  }

  function alternarColuna(daColuna: LeadCartao[], jaTodos: boolean) {
    setConfirmando(false);
    setSelecionados((atual) => {
      const proximo = new Set(atual);
      for (const lead of daColuna) {
        if (jaTodos) proximo.delete(lead.id);
        else proximo.add(lead.id);
      }
      return proximo;
    });
  }

  function excluirSelecionados() {
    const ids = [...selecionados];
    // Guarda a lista de antes: se o banco recusar, sumir da tela sem ter
    // sumido de verdade e pior que o erro — o lead volta a aparecer no
    // proximo carregamento e ninguem entende por que.
    const antes = leads;

    setLeads((atual) => atual.filter((lead) => !selecionados.has(lead.id)));
    setSelecionados(new Set());
    setConfirmando(false);
    setAviso(null);

    iniciar(async () => {
      const r = await removerLeads(ids);
      if (!r.ok) {
        setLeads(antes);
        setAviso(r.erro ?? "Não consegui excluir.");
        return;
      }
      setAviso(
        r.total === 1 ? "1 lead removido do funil." : `${r.total ?? ids.length} leads removidos do funil.`,
      );
    });
  }

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
      {selecionados.size > 0 && (
        <div className="sticky top-2 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-3 shadow-lg">
          <span className="text-sm font-semibold text-slate-900">
            {selecionados.size === 1
              ? "1 lead selecionado"
              : `${selecionados.size} leads selecionados`}
          </span>

          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setSelecionados(new Set());
                setConfirmando(false);
              }}
              className="botao-secundario !px-3 !py-1.5 !text-sm"
            >
              Limpar seleção
            </button>

            {/* Dois toques de propósito: excluir aqui não tem desfazer. */}
            {confirmando ? (
              <button
                type="button"
                onClick={excluirSelecionados}
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Confirmar exclusão de {selecionados.size}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmando(true)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-50"
              >
                Excluir selecionados
              </button>
            )}
          </div>

          {confirmando && (
            <p className="w-full text-xs leading-relaxed text-slate-600">
              Sai só do funil. A empresa continua nos resultados e no radar, então dá para
              trazer de volta depois.
            </p>
          )}
        </div>
      )}

      {aviso && (
        <p
          className="mb-3 rounded-lg bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700"
          role="status"
        >
          {aviso}
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        {LEAD_STATUS_ORDEM.map((status) => {
          const daColuna = leads.filter((lead) => lead.status === status);
          const destacada = colunaAlvo === status;
          const todosMarcados =
            daColuna.length > 0 && daColuna.every((lead) => selecionados.has(lead.id));

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
                {daColuna.length > 0 && (
                  <button
                    type="button"
                    onClick={() => alternarColuna(daColuna, todosMarcados)}
                    className="ml-auto rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 transition hover:bg-white hover:text-slate-700"
                  >
                    {todosMarcados ? "Desmarcar" : "Marcar todos"}
                  </button>
                )}
                <span
                  className={`rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ${
                    daColuna.length === 0 ? "ml-auto" : ""
                  }`}
                >
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
                    className={`cursor-grab rounded-xl border bg-white p-3 shadow-sm transition active:cursor-grabbing ${
                      selecionados.has(lead.id)
                        ? "border-marca-400 ring-2 ring-marca-200"
                        : "border-slate-200"
                    } ${arrastando === lead.id ? "opacity-50" : "hover:shadow-md"}`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selecionados.has(lead.id)}
                        onChange={() => alternar(lead.id)}
                        aria-label={`Selecionar ${lead.empresa?.nome ?? "lead"}`}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-marca-500"
                      />
                      <button
                        type="button"
                        onClick={() => setDetalhe(lead)}
                        className="min-w-0 flex-1 text-left"
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
                        <SeloStatus
                          sinais={{
                            lead_id: lead.id,
                            lead_status: lead.status,
                            contatado_fila_em: lead.empresa?.contatadoFilaEm ?? null,
                          }}
                          curto
                        />
                        {lead.empresa && <SeloPrioridade prioridade={lead.empresa.prioridade} />}
                        {lead.ultimoContatoEm && (
                          <span className="text-[11px] text-slate-400">
                            {tempoRelativo(lead.ultimoContatoEm)}
                          </span>
                        )}
                      </div>
                    </button>
                    </div>

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

  function naoContatar() {
    const numero = lead.empresa?.whatsappE164;
    if (!numero) return;
    iniciar(async () => {
      const resposta = await bloquearContato(numero, lead.id);
      if (resposta.ok) aoRemover(lead.id);
      else setMensagem(resposta.erro ?? "Não consegui registrar.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#020617]/50"
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
          {lead.empresa?.whatsappE164 && (
            <button
              type="button"
              onClick={naoContatar}
              disabled={pendente}
              className="text-sm font-medium text-slate-600 hover:underline"
              title="Registra a recusa: o número sai de todas as filas e novas buscas não o trazem de volta"
            >
              Pediu para não receber
            </button>
          )}
          <button type="button" onClick={salvar} disabled={pendente} className="botao-primario !px-4 !py-2 !text-sm">
            {pendente ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
