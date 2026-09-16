"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { LinhaEmpresa } from "./LinhaEmpresa";
import { adicionarLeadsEmLote } from "@/app/app/acoes";
import { ORDEM_STATUS, STATUS_LEAD, statusDoLead, type StatusLead } from "@/lib/status-lead";
import type { EmpresaRadar, PrioridadeRadar } from "@/lib/types";

type Filtro = "todas" | "sem_site" | "poucas_avaliacoes" | "sem_instagram" | "intocadas";
type Coluna = "empresa" | "score" | "status";

const FILTROS: { id: Filtro; rotulo: string }[] = [
  { id: "todas", rotulo: "Todas" },
  { id: "sem_site", rotulo: "Sem site" },
  { id: "poucas_avaliacoes", rotulo: "Poucas avaliações" },
  { id: "sem_instagram", rotulo: "Sem Instagram" },
  { id: "intocadas", rotulo: "Intocadas" },
];

const ORDEM_PRIORIDADE: Record<PrioridadeRadar, number> = {
  alta: 0,
  media_alta: 1,
  media: 2,
  baixa: 3,
};

export function ListaResultados({ empresas }: { empresas: EmpresaRadar[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [status, setStatus] = useState<StatusLead | "todos">("todos");
  const [ordem, setOrdem] = useState<Coluna>("score");
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  // Contagem por status, para os chips dizerem quanto tem em cada etapa.
  const contagem = useMemo(() => {
    const mapa = new Map<StatusLead, number>();
    for (const empresa of empresas) {
      const s = statusDoLead(empresa);
      mapa.set(s, (mapa.get(s) ?? 0) + 1);
    }
    return mapa;
  }, [empresas]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas
      .filter((empresa) => {
        if (termo && !empresa.nome.toLowerCase().includes(termo)) {
          if (!(empresa.endereco ?? "").toLowerCase().includes(termo)) return false;
        }
        if (status !== "todos" && statusDoLead(empresa) !== status) return false;
        switch (filtro) {
          case "sem_site":
            return !empresa.website;
          case "poucas_avaliacoes":
            return empresa.total_avaliacoes < 10;
          case "sem_instagram":
            return !empresa.instagram;
          case "intocadas":
            return !empresa.lead_id;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        if (ordem === "empresa") return a.nome.localeCompare(b.nome, "pt-BR");
        if (ordem === "status") {
          const diff =
            ORDEM_STATUS.indexOf(statusDoLead(a)) - ORDEM_STATUS.indexOf(statusDoLead(b));
          if (diff !== 0) return diff;
          return b.score_radar - a.score_radar;
        }
        const diff = ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];
        if (diff !== 0) return diff;
        return b.score_radar - a.score_radar;
      });
  }, [empresas, filtro, status, ordem, busca]);

  function alternar(id: string, marcado: boolean) {
    setSelecionadas((anterior) => {
      const proximo = new Set(anterior);
      if (marcado) proximo.add(id);
      else proximo.delete(id);
      return proximo;
    });
  }

  const selecionaveis = filtradas.filter((e) => !e.lead_id);
  const todasMarcadas = selecionaveis.length > 0 && selecionaveis.every((e) => selecionadas.has(e.id));

  function alternarTodas() {
    setSelecionadas(todasMarcadas ? new Set() : new Set(selecionaveis.map((e) => e.id)));
  }

  function enviarSelecionadas() {
    setAviso(null);
    const total = selecionadas.size;
    iniciar(async () => {
      const resposta = await adicionarLeadsEmLote([...selecionadas]);
      if (resposta.ok) {
        setAviso(`${total} empresa(s) no funil — já estão na fila de mensagens.`);
        setSelecionadas(new Set());
      } else {
        setAviso(resposta.erro ?? "Não foi possível enviar as empresas.");
      }
    });
  }

  return (
    <div>
      <div className="cartao mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filtro === item.id
                  ? "bg-marca-600 text-[#ffffff]"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        <input
          className="campo ml-auto !w-auto min-w-[180px] flex-1 !py-1.5 !text-sm sm:max-w-xs"
          placeholder="Filtrar por nome ou endereço"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        {/* Filtro por etapa: mesma cor do chip que aparece na coluna Status. */}
        <div className="flex w-full flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setStatus("todos")}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${
              status === "todos"
                ? "bg-slate-900 text-white ring-slate-900"
                : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Todos os status
          </button>
          {ORDEM_STATUS.map((id) => {
            const total = contagem.get(id) ?? 0;
            if (total === 0) return null;
            const descricao = STATUS_LEAD[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStatus(status === id ? "todos" : id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 transition ${
                  status === id ? descricao.classe : "bg-white text-slate-500 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${descricao.ponto}`} />
                {descricao.rotulo}
                <span className="tabular-nums opacity-60">{total}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-slate-600">
          {filtradas.length} empresa{filtradas.length === 1 ? "" : "s"}
        </span>
        {selecionadas.size > 0 && (
          <>
            <button
              type="button"
              onClick={() => setSelecionadas(new Set())}
              className="text-xs font-medium text-slate-500 hover:underline"
            >
              Limpar seleção
            </button>
            <button
              type="button"
              onClick={enviarSelecionadas}
              disabled={pendente}
              className="botao-primario ml-auto !px-3 !py-1.5 !text-xs"
            >
              {pendente ? "Enviando…" : `Enviar ${selecionadas.size} para o funil`}
            </button>
          </>
        )}
      </div>

      {aviso && (
        <div
          className="anim-entrada mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700"
          role="status"
        >
          <span>{aviso}</span>
          <Link href="/app/enviar-mensagem" className="font-semibold underline">
            Ir para a fila
          </Link>
        </div>
      )}

      {filtradas.length === 0 ? (
        <p className="cartao px-6 py-12 text-center text-sm text-slate-500">
          Nenhuma empresa corresponde a esse filtro.
        </p>
      ) : (
        <div className="cartao overflow-hidden">
          {/* Cabeçalho das colunas — mesma grade das linhas, então tudo alinha. */}
          <div className="grade-lead border-b border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-semibold uppercase text-slate-500 sm:px-4 sm:text-[11px] sm:tracking-wide">
            <input
              type="checkbox"
              checked={todasMarcadas}
              onChange={alternarTodas}
              disabled={selecionaveis.length === 0}
              className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500 disabled:opacity-40"
              aria-label="Selecionar todas as empresas visíveis"
            />
            <BotaoColuna atual={ordem} coluna="empresa" aoOrdenar={setOrdem}>
              Empresa
            </BotaoColuna>
            <BotaoColuna atual={ordem} coluna="score" aoOrdenar={setOrdem} className="justify-self-center">
              Score
            </BotaoColuna>
            <BotaoColuna atual={ordem} coluna="status" aoOrdenar={setOrdem}>
              Status
            </BotaoColuna>
            <span className="justify-self-center sm:justify-self-stretch">Zap</span>
          </div>

          <ul className="lista-filetes">
            {filtradas.map((empresa) => (
              <LinhaEmpresa
                key={empresa.id}
                empresa={empresa}
                selecionavel
                selecionada={selecionadas.has(empresa.id)}
                aoSelecionar={alternar}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Cabeçalho clicável: ordena a lista por aquela coluna. */
function BotaoColuna({
  coluna,
  atual,
  aoOrdenar,
  className = "",
  children,
}: {
  coluna: Coluna;
  atual: Coluna;
  aoOrdenar: (coluna: Coluna) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ativa = atual === coluna;
  return (
    <button
      type="button"
      onClick={() => aoOrdenar(coluna)}
      aria-pressed={ativa}
      className={`inline-flex min-w-0 items-center gap-1 uppercase transition hover:text-slate-900 ${
        ativa ? "text-slate-900" : ""
      } ${className}`}
    >
      <span className={`truncate ${ativa ? "underline decoration-slate-400 underline-offset-2 sm:no-underline" : ""}`}>
        {children}
      </span>
      {ativa && (
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="hidden h-2.5 w-2.5 shrink-0 fill-current sm:block"
        >
          <path d="M10 14L4 7h12l-6 7Z" />
        </svg>
      )}
    </button>
  );
}
