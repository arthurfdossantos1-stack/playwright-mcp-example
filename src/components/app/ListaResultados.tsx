"use client";

import { useMemo, useState, useTransition } from "react";
import { CartaoEmpresa } from "./CartaoEmpresa";
import { adicionarLeadsEmLote } from "@/app/app/acoes";
import type { EmpresaRadar, PrioridadeRadar } from "@/lib/types";

type Filtro = "todas" | "sem_site" | "poucas_avaliacoes" | "sem_instagram" | "intocadas";

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
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return empresas
      .filter((empresa) => {
        if (termo && !empresa.nome.toLowerCase().includes(termo)) {
          if (!(empresa.endereco ?? "").toLowerCase().includes(termo)) return false;
        }
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
        const diff = ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade];
        if (diff !== 0) return diff;
        return b.score_radar - a.score_radar;
      });
  }, [empresas, filtro, busca]);

  function alternar(id: string, marcado: boolean) {
    setSelecionadas((anterior) => {
      const proximo = new Set(anterior);
      if (marcado) proximo.add(id);
      else proximo.delete(id);
      return proximo;
    });
  }

  function selecionarVisiveis() {
    setSelecionadas(new Set(filtradas.filter((e) => !e.lead_id).map((e) => e.id)));
  }

  function enviarSelecionadas() {
    setAviso(null);
    iniciar(async () => {
      const resposta = await adicionarLeadsEmLote([...selecionadas]);
      if (resposta.ok) {
        setAviso(`${selecionadas.size} empresa(s) enviada(s) para o funil.`);
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
                  ? "bg-marca-600 text-white"
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
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium text-slate-600">
          {filtradas.length} empresa{filtradas.length === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={selecionarVisiveis}
          className="text-xs font-semibold text-marca-700 hover:underline"
        >
          Selecionar todas as visíveis
        </button>
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
        <p className="mb-4 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
          {aviso}
        </p>
      )}

      {filtradas.length === 0 ? (
        <p className="cartao px-6 py-12 text-center text-sm text-slate-500">
          Nenhuma empresa corresponde a esse filtro.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtradas.map((empresa) => (
            <CartaoEmpresa
              key={empresa.id}
              empresa={empresa}
              selecionavel
              selecionada={selecionadas.has(empresa.id)}
              aoSelecionar={alternar}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
