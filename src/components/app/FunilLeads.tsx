"use client";

import { useState, useTransition } from "react";
import {
  atualizarLead,
  matricularEmCadencia,
  bloquearContato,
  marcarContatadoFila,
  moverLead,
  registrarInteracao,
  removerLead,
  removerLeads,
} from "@/app/app/acoes";
import { SeloPrioridade } from "./SeloPrioridade";
import { SeloStatus } from "./SeloStatus";
import { limparUrl, tempoRelativo } from "@/lib/format";
import { linkWhatsappEmpresa } from "@/lib/whatsapp";
import { STATUS_DO_ESTAGIO, STATUS_LEAD } from "@/lib/status-lead";
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
  /**
   * Qual estagio esta na tela.
   *
   * Antes eram quatro colunas empilhadas: no celular, ver quem RESPONDEU
   * exigia rolar por todos os "novo" e todos os "contatado" — a melhor
   * noticia do produto ficava a milhares de pixels. Agora e um toque.
   */
  const [estagio, setEstagio] = useState<LeadStatus>("novo");
  const [detalhe, setDetalhe] = useState<LeadCartao | null>(null);
  const [selecionados, setSelecionados] = useState<ReadonlySet<string>>(new Set());
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Erro separado do aviso: sucesso e falha rendiam identicos, em cinza. */
  const [erro, setErro] = useState<string | null>(null);
  const [desfazer, setDesfazer] = useState<{ leadId: string; de: LeadStatus } | null>(null);
  const [pendente, iniciar] = useTransition();

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
    setErro(null);
    setDesfazer(null);

    iniciar(async () => {
      const r = await removerLeads(ids);
      if (!r.ok) {
        setLeads(antes);
        setErro(r.erro ?? "Não consegui excluir.");
        return;
      }
      setAviso(
        r.total === 1 ? "1 lead removido do funil." : `${r.total ?? ids.length} leads removidos do funil.`,
      );
    });
  }

  /**
   * Move um lead de estagio.
   *
   * O retorno era descartado: a rede caia, o cartao mudava de lugar na tela,
   * o banco nao, e o lead voltava sozinho no proximo carregamento. Agora a
   * falha reverte e aparece, e o acerto vem com desfazer — mover era a unica
   * acao da tela sem volta.
   */
  function mover(leadId: string, status: LeadStatus) {
    const anterior = leads.find((l) => l.id === leadId)?.status;
    setLeads((atual) => atual.map((lead) => (lead.id === leadId ? { ...lead, status } : lead)));
    setAviso(null);

    iniciar(async () => {
      const r = await moverLead(leadId, status);
      if (!r.ok) {
        if (anterior) {
          setLeads((atual) =>
            atual.map((lead) => (lead.id === leadId ? { ...lead, status: anterior } : lead)),
          );
        }
        setErro(r.erro ?? "Não consegui mover o lead.");
        return;
      }
      if (anterior && anterior !== status) setDesfazer({ leadId, de: anterior });
    });
  }

  return (
    <>
      {/*
        A barra fica em top-16, nao top-2: o cabecalho do app e sticky com
        56px, e ela se escondia atras dele durante a rolagem — voce
        confirmava uma exclusao que nao estava vendo.
      */}
      {selecionados.size > 0 && (
        <div className="sticky top-16 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-300 bg-white p-3 shadow-lg sm:top-4">
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

      {erro && (
        <p
          className="mb-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800 ring-1 ring-rose-200"
          role="alert"
        >
          {erro}
        </p>
      )}

      {desfazer && (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm text-[#ffffff]"
          role="status"
        >
          <span>Lead movido.</span>
          <button
            type="button"
            onClick={() => {
              const { leadId, de } = desfazer;
              setDesfazer(null);
              mover(leadId, de);
            }}
            className="ml-auto min-h-11 rounded-lg px-3 font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-400"
          >
            Desfazer
          </button>
        </div>
      )}

      {aviso && (
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200"
          role="status"
        >
          {aviso}
        </p>
      )}

      {/*
        Filtro de estagio no lugar das quatro colunas empilhadas.

        O kanban supunha tela larga e mouse: no toque os eventos de arrastar
        nem disparam, e a alternativa eram pastilhas de 23px. Aqui o estagio
        e um filtro, o cartao ganha a largura toda, e avancar vira um alvo
        de 44px — o gesto que a tela existe para servir.
      */}
      <div className="sticky top-16 z-20 -mx-4 mb-3 bg-slate-50/95 px-4 py-2 backdrop-blur sm:top-4 sm:mx-0 sm:rounded-xl sm:px-2">
        <div
          role="tablist"
          aria-label="Estágio do funil"
          /* Grade, nao rolagem horizontal: em 390px as quatro abas em uma
             linha davam 457px de conteudo em 342px de espaco, e "Fechado"
             sobrava 19px visiveis atras de um scroll sem nenhuma pista na
             tela. Duas por linha cabem inteiras sem rolar nada. */
          className="grid grid-cols-2 gap-1 sm:grid-cols-4"
        >
          {LEAD_STATUS_ORDEM.map((s) => {
            const quantos = leads.filter((lead) => lead.status === s).length;
            const ativo = s === estagio;
            return (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={ativo}
                onClick={() => setEstagio(s)}
                className={`flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition ${
                  ativo
                    ? "bg-marca-600 text-[#ffffff]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    ativo ? "bg-[#ffffff]" : STATUS_LEAD[STATUS_DO_ESTAGIO[s]].ponto
                  }`}
                />
                {LEAD_STATUS_LABEL[s]}
                <span className={ativo ? "opacity-80" : "text-slate-500"}>{quantos}</span>
              </button>
            );
          })}
        </div>
      </div>

      {(() => {
        const doEstagio = leads.filter((lead) => lead.status === estagio);
        const todosMarcados =
          doEstagio.length > 0 && doEstagio.every((lead) => selecionados.has(lead.id));
        const proximo = LEAD_STATUS_ORDEM[LEAD_STATUS_ORDEM.indexOf(estagio) + 1] ?? null;

        if (doEstagio.length === 0) {
          return (
            <p className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
              Nenhum lead em {LEAD_STATUS_LABEL[estagio].toLowerCase()}.
            </p>
          );
        }

        return (
          <>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs text-slate-500">
                {doEstagio.length} {doEstagio.length === 1 ? "lead" : "leads"}, do maior score do
                Radar para o menor
              </p>
              <button
                type="button"
                onClick={() => alternarColuna(doEstagio, todosMarcados)}
                className="min-h-11 rounded-lg px-2 text-xs font-semibold text-slate-600 transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
              >
                {todosMarcados ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>

            <ul className="space-y-2.5">
              {doEstagio.map((lead) => (
                <li
                  key={lead.id}
                  className={`rounded-xl border bg-white shadow-sm transition ${
                    selecionados.has(lead.id)
                      ? "border-marca-400 ring-2 ring-marca-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start">
                    {/* Alvo de 44px: o quadrado continua com 16px, a area de
                        toque e que cresce. Uma mao, andando, erra menos. */}
                    <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center p-3">
                      <input
                        type="checkbox"
                        checked={selecionados.has(lead.id)}
                        onChange={() => alternar(lead.id)}
                        aria-label={`Selecionar ${lead.empresa?.nome ?? "lead"}`}
                        className="h-4 w-4 cursor-pointer accent-marca-500"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setDetalhe(lead)}
                      className="min-w-0 flex-1 py-3 pr-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
                    >
                      <span className="block text-sm font-semibold leading-snug text-slate-900">
                        {lead.empresa?.nome ?? "Empresa removida"}
                      </span>
                      {lead.empresa && (
                        <span className="mt-1 block truncate text-xs text-slate-500">
                          {lead.empresa.website ? limparUrl(lead.empresa.website) : "Sem site"}
                          {lead.empresa.telefone ? ` · ${lead.empresa.telefone}` : ""}
                        </span>
                      )}
                      <span className="mt-2 flex flex-wrap items-center gap-1.5">
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
                          <span className="text-[11px] text-slate-500">
                            contato {tempoRelativo(lead.ultimoContatoEm)}
                          </span>
                        )}
                      </span>
                    </button>
                  </div>

                  <div className="flex gap-1.5 border-t border-slate-100 p-2">
                    {proximo ? (
                      <button
                        type="button"
                        onClick={() => mover(lead.id, proximo)}
                        disabled={pendente}
                        className="botao-primario min-h-11 flex-1 !py-2 !text-sm"
                      >
                        Avançar para {LEAD_STATUS_LABEL[proximo]}
                      </button>
                    ) : (
                      <span className="flex min-h-11 flex-1 items-center justify-center text-sm font-semibold text-emerald-700">
                        Fechado
                      </span>
                    )}
                    <select
                      aria-label={`Mover ${lead.empresa?.nome ?? "lead"} para outro estágio`}
                      value=""
                      onChange={(e) => {
                        if (e.target.value) mover(lead.id, e.target.value as LeadStatus);
                      }}
                      className="min-h-11 rounded-lg bg-slate-100 px-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-marca-500"
                    >
                      <option value="">Mover…</option>
                      {LEAD_STATUS_ORDEM.filter((s) => s !== lead.status).map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                </li>
              ))}
            </ul>
          </>
        );
      })()}


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
  /** Dois toques: bloquear nao tem desfazer pela tela. */
  const [confirmandoBloqueio, setConfirmandoBloqueio] = useState(false);
  const [pendente, iniciar] = useTransition();

  const whatsapp = lead.empresa
    ? linkWhatsappEmpresa({
        whatsapp_e164: lead.empresa.whatsappE164,
        telefone: lead.empresa.telefone,
      })
    : null;

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
      const r = await registrarInteracao(lead.id, "Contato registrado manualmente", "outro");
      // Antes dizia "Contato registrado." sem conferir nada — ou seja, mentia
      // quando o banco recusava.
      setMensagem(r.ok ? "Contato registrado." : (r.erro ?? "Não consegui registrar."));
    });
  }

  /**
   * Abre o WhatsApp e tira o lead da fila automatica.
   *
   * Sem a segunda parte, quem voce mensageia na mao continua enfileirado: o
   * disparo automatico manda de novo depois, e a pessoa recebe duas vezes da
   * mesma empresa. A tela fabricava o proprio envio duplicado.
   */
  function aoAbrirWhatsapp() {
    const empresaId = lead.empresa?.id;
    if (!empresaId) return;
    iniciar(async () => {
      await marcarContatadoFila(empresaId, lead.id);
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
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
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                onClick={aoAbrirWhatsapp}
                className="botao-secundario !px-3 !py-1.5 !text-xs"
              >
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

        {/* Salvar sozinho. Antes ele dividia uma linha justify-between com
            duas acoes destrutivas, como se os tres fossem pares — e a mais
            irreversivel das tres caia no centro do rodape de uma folha
            inferior, que e onde o polegar descansa. */}
        <div className="mt-6">
          <button
            type="button"
            onClick={salvar}
            disabled={pendente}
            className="botao-primario min-h-11 w-full !text-sm"
          >
            {pendente ? "Salvando…" : "Salvar"}
          </button>
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={remover}
            disabled={pendente}
            className="min-h-11 text-sm font-medium text-rose-700 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            Remover do funil
          </button>

          {lead.empresa?.whatsappE164 && (
            <div className="rounded-xl border border-slate-200 p-3.5">
              <h3 className="text-sm font-bold text-slate-900">Pediu para não receber</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                O número entra na lista de não perturbe: sai de qualquer disparo já
                enfileirado, some de todas as filas e <strong>nenhuma busca futura o traz de
                volta</strong>. Vale para a plataforma inteira e não tem como desfazer pela tela.
              </p>
              {confirmandoBloqueio ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={naoContatar}
                    disabled={pendente}
                    className="min-h-11 rounded-lg bg-rose-600 px-3 text-sm font-semibold text-[#ffffff] transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                  >
                    Confirmar: não contatar mais
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoBloqueio(false)}
                    className="botao-secundario min-h-11 !text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmandoBloqueio(true)}
                  disabled={pendente}
                  className="mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-rose-700 ring-1 ring-rose-300 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                >
                  Registrar recusa
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
