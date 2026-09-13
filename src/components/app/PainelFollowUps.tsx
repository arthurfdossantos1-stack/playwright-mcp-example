"use client";

import { useState, useTransition } from "react";
import { cancelarFollowUp, marcarFollowUpEnviado } from "@/app/app/acoes";
import { formatarDataHora, linkWhatsApp } from "@/lib/format";
import { CANAL_LABEL, type CanalContato } from "@/lib/types";

export type FollowUpItem = {
  id: string;
  agendadoPara: string;
  canal: string;
  mensagem: string | null;
  empresa: string;
  telefone: string | null;
};

export function PainelFollowUps({ followUps }: { followUps: FollowUpItem[] }) {
  const [lista, setLista] = useState(followUps);
  const [pendente, iniciar] = useTransition();
  const [aberto, setAberto] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  function concluir(id: string) {
    iniciar(async () => {
      const resposta = await marcarFollowUpEnviado(id);
      if (resposta.ok) setLista((atual) => atual.filter((f) => f.id !== id));
    });
  }

  function descartar(id: string) {
    iniciar(async () => {
      const resposta = await cancelarFollowUp(id);
      if (resposta.ok) setLista((atual) => atual.filter((f) => f.id !== id));
    });
  }

  async function copiar(item: FollowUpItem) {
    if (!item.mensagem) return;
    try {
      await navigator.clipboard.writeText(item.mensagem);
      setCopiado(item.id);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      /* navegador sem clipboard: o texto continua visível para copiar à mão */
    }
  }

  if (lista.length === 0) {
    return (
      <div className="cartao px-5 py-10 text-center">
        <span className="grid h-10 w-10 mx-auto place-items-center rounded-xl bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className="mt-3 text-sm font-semibold text-slate-900">Nenhum follow-up vencido</p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-slate-600">
          Quando uma etapa de cadência vencer, ela aparece aqui com a mensagem pronta.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {lista.map((item) => {
        const whatsapp = linkWhatsApp(item.telefone, item.mensagem ?? "");
        const expandido = aberto === item.id;

        return (
          <li key={item.id} className="cartao p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{item.empresa}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {CANAL_LABEL[(item.canal as CanalContato) ?? "outro"] ?? item.canal} · vencido em{" "}
                  {formatarDataHora(item.agendadoPara)}
                </p>
              </div>
              <div className="flex gap-2">
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Abrir WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => concluir(item.id)}
                  disabled={pendente}
                  className="botao-primario !px-3 !py-1.5 !text-xs"
                >
                  Marcar enviado
                </button>
              </div>
            </div>

            {item.mensagem && (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setAberto(expandido ? null : item.id)}
                  className="text-xs font-semibold text-marca-700 hover:underline"
                >
                  {expandido ? "Esconder mensagem" : "Ver mensagem pronta"}
                </button>

                {expandido && (
                  <div className="mt-2">
                    <pre className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                      {item.mensagem}
                    </pre>
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => copiar(item)}
                        className="text-xs font-semibold text-marca-700 hover:underline"
                      >
                        {copiado === item.id ? "Copiado!" : "Copiar mensagem"}
                      </button>
                      <button
                        type="button"
                        onClick={() => descartar(item.id)}
                        disabled={pendente}
                        className="text-xs font-medium text-slate-500 hover:underline"
                      >
                        Descartar este follow-up
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
