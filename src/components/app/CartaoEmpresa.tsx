"use client";

import { useState, useTransition } from "react";
import { adicionarLead, removerLead } from "@/app/app/acoes";
import { SeloPrioridade } from "./SeloPrioridade";
import { BotaoGerarPrevia } from "./PainelPrevia";
import { limparUrl, linkWhatsApp } from "@/lib/format";
import type { EmpresaRadar } from "@/lib/types";

export function CartaoEmpresa({
  empresa,
  selecionavel = false,
  selecionada = false,
  destaque = false,
  aoSelecionar,
}: {
  empresa: EmpresaRadar;
  /** Primeiro da fila: ganha a fita colorida e mais peso visual. */
  destaque?: boolean;
  selecionavel?: boolean;
  selecionada?: boolean;
  aoSelecionar?: (id: string, marcado: boolean) => void;
}) {
  const [pendente, iniciar] = useTransition();
  const [noFunil, setNoFunil] = useState(Boolean(empresa.lead_id));
  const [leadId, setLeadId] = useState<string | null>(empresa.lead_id);
  const [erro, setErro] = useState<string | null>(null);

  function enviarParaFunil() {
    setErro(null);
    iniciar(async () => {
      const resposta = await adicionarLead(empresa.id);
      if (resposta.ok) {
        setNoFunil(true);
        setLeadId(resposta.id ?? null);
      } else {
        setErro(resposta.erro ?? "Não foi possível enviar para o funil.");
      }
    });
  }

  function tirarDoFunil() {
    if (!leadId) return;
    setErro(null);
    iniciar(async () => {
      const resposta = await removerLead(leadId);
      if (resposta.ok) {
        setNoFunil(false);
        setLeadId(null);
      } else {
        setErro(resposta.erro ?? "Não foi possível remover do funil.");
      }
    });
  }

  const whatsapp = linkWhatsApp(empresa.telefone);

  return (
    <li
      className={
        destaque
          ? "cartao-acao cartao-acao--quente p-4 pt-5 sm:p-5 sm:pt-6"
          : "cartao p-4 sm:p-5"
      }
    >
      <div className="flex flex-wrap items-start gap-3">
        {selecionavel && (
          <input
            type="checkbox"
            checked={selecionada}
            onChange={(e) => aoSelecionar?.(empresa.id, e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
            aria-label={`Selecionar ${empresa.nome}`}
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[0.95rem] font-bold text-slate-900">{empresa.nome}</h3>
            <SeloPrioridade prioridade={empresa.prioridade} intocado={!noFunil} />
          </div>

          {empresa.endereco && (
            <p className="mt-1 text-sm text-slate-600">{empresa.endereco}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
            {empresa.nota != null ? (
              <span className="inline-flex items-center gap-1 text-slate-700">
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-amber-400" aria-hidden="true">
                  <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.22l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z" />
                </svg>
                {empresa.nota.toFixed(1)}
                <span className="text-slate-400">({empresa.total_avaliacoes})</span>
              </span>
            ) : (
              <span className="text-slate-400">Sem avaliações</span>
            )}

            {empresa.telefone ? (
              <a href={`tel:${empresa.telefone}`} className="text-slate-700 hover:text-marca-700">
                {empresa.telefone}
              </a>
            ) : (
              <span className="text-slate-400">Sem telefone</span>
            )}

            {empresa.website ? (
              <a
                href={empresa.website}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="truncate text-marca-700 hover:underline"
              >
                {limparUrl(empresa.website)}
              </a>
            ) : (
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-medium text-rose-700">
                Sem site
              </span>
            )}

            {empresa.instagram ? (
              <a
                href={empresa.instagram}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-marca-700 hover:underline"
              >
                {limparUrl(empresa.instagram).replace("instagram.com/", "@")}
              </a>
            ) : (
              <span className="text-slate-400">Sem Instagram</span>
            )}
          </div>

          {empresa.motivos_radar?.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {empresa.motivos_radar.map((motivo) => (
                <li
                  key={motivo}
                  className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600"
                >
                  {motivo}
                </li>
              ))}
            </ul>
          )}

          {erro && <p className="mt-3 text-sm text-rose-700">{erro}</p>}
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          {noFunil ? (
            <button
              type="button"
              onClick={tirarDoFunil}
              disabled={pendente}
              className="botao-secundario !px-3 !py-1.5 !text-xs"
            >
              {pendente ? "…" : "No funil ✓"}
            </button>
          ) : (
            <button
              type="button"
              onClick={enviarParaFunil}
              disabled={pendente}
              className="botao-primario !px-3 !py-1.5 !text-xs"
            >
              {pendente ? "…" : "Enviar para o funil"}
            </button>
          )}

          <div className="flex gap-2">
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                WhatsApp
              </a>
            )}
            {empresa.google_maps_url && (
              <a
                href={empresa.google_maps_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Maps
              </a>
            )}
            {!empresa.website && <BotaoGerarPrevia empresaId={empresa.id} empresaNome={empresa.nome} />}
          </div>
        </div>
      </div>
    </li>
  );
}
