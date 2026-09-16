"use client";

import { useState } from "react";
import { gerarPreviaSite, obterContextoPrevia } from "@/app/app/acoes";
import { formatarDataHora } from "@/lib/format";

type Historico = { id: string; prompt_gerado: string; criado_em: string };

export function BotaoGerarPrevia({ empresaId, empresaNome }: { empresaId: string; empresaNome: string }) {
  const [aberto, setAberto] = useState(false);
  const [carregandoContexto, setCarregandoContexto] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [usadasHoje, setUsadasHoje] = useState<number | null>(null);
  const [limite, setLimite] = useState(5);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  async function abrir() {
    setAberto(true);
    setErro(null);
    setCarregandoContexto(true);
    try {
      const contexto = await obterContextoPrevia(empresaId);
      setUsadasHoje(contexto.usadasHoje);
      setLimite(contexto.limite);
      setHistorico(contexto.historico);
    } catch {
      setErro("Não foi possível carregar o histórico de prévias.");
    } finally {
      setCarregandoContexto(false);
    }
  }

  async function gerar() {
    setGerando(true);
    setErro(null);
    setCopiado(false);
    const resposta = await gerarPreviaSite(empresaId);
    setGerando(false);

    if (!resposta.ok) {
      setErro(resposta.erro ?? "Não foi possível gerar a prévia.");
      if (typeof resposta.restantes === "number") setUsadasHoje(resposta.limite! - resposta.restantes);
      return;
    }

    setUsadasHoje((atual) => (atual ?? 0) + 1);
    if (resposta.prompt) {
      setHistorico((atual) => [
        { id: `novo-${Date.now()}`, prompt_gerado: resposta.prompt!, criado_em: new Date().toISOString() },
        ...atual,
      ]);
    }
  }

  async function copiar(texto: string, chave: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sem clipboard: o texto continua selecionável na tela */
    }
    void chave;
  }

  const restantes = usadasHoje != null ? Math.max(0, limite - usadasHoje) : null;
  const esgotado = restantes === 0;

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
      >
        ✨ Gerar prévia
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-[#020617]/50"
            onClick={() => setAberto(false)}
            aria-label="Fechar"
          />
          <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Prévia de site — {empresaNome}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Gera um prompt pronto pra colar em outra IA (Claude, v0, bolt.new…) e criar uma prévia
                  de site pra esse lead. Não inclui a chamada real do modelo de terceiros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm">
              {carregandoContexto ? (
                <span className="text-slate-400">Carregando cota…</span>
              ) : usadasHoje != null ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    esgotado ? "bg-rose-50 text-rose-700" : "bg-marca-50 text-marca-700"
                  }`}
                >
                  {restantes} de {limite} prévias hoje
                </span>
              ) : null}
            </div>

            {erro && (
              <p className="anim-entrada mt-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
                {erro}
              </p>
            )}

            <button
              type="button"
              onClick={gerar}
              disabled={gerando || carregandoContexto || esgotado}
              className="botao-primario mt-4 w-full"
            >
              {gerando ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Gerando com IA…
                </>
              ) : esgotado ? (
                "Limite diário atingido"
              ) : (
                "Gerar novo prompt"
              )}
            </button>

            {historico.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {historico.length === 1 ? "Prompt gerado" : "Prompts gerados"}
                </h3>
                <ul className="space-y-3">
                  {historico.map((item) => (
                    <li key={item.id} className="rounded-lg border border-slate-200 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">{formatarDataHora(item.criado_em)}</span>
                        <button
                          type="button"
                          onClick={() => copiar(item.prompt_gerado, item.id)}
                          className="text-xs font-semibold text-marca-700 hover:underline"
                        >
                          {copiado ? "Copiado!" : "Copiar prompt"}
                        </button>
                      </div>
                      <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2.5 text-xs leading-relaxed text-slate-700">
                        {item.prompt_gerado}
                      </pre>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
