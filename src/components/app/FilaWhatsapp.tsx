"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { desfazerContatadoFila, marcarContatadoFila } from "@/app/app/acoes";
import { SeloPrioridade } from "./SeloPrioridade";
import { aplicarVariaveis, contextoDaEmpresa } from "@/lib/templates";
import { linkWaMe } from "@/lib/whatsapp";
import type { Empresa, Template } from "@/lib/types";

export type ItemFila = Pick<
  Empresa,
  "id" | "nome" | "endereco" | "telefone" | "whatsapp_e164" | "nota" | "total_avaliacoes" | "instagram" | "website" | "prioridade"
> & {
  nicho: string | null;
  cidade: string | null;
};

export function FilaWhatsapp({
  filaInicial,
  templates,
  meuNome,
}: {
  filaInicial: ItemFila[];
  templates: Template[];
  meuNome: string;
}) {
  const [fila, setFila] = useState(filaInicial);
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.canal === "whatsapp")?.id ?? templates[0]?.id ?? "",
  );
  const [pendente, setPendente] = useState<ItemFila | null>(null);
  const [processando, setProcessando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string; empresa?: ItemFila } | null>(
    null,
  );
  const pendenteRef = useRef<ItemFila | null>(null);
  pendenteRef.current = pendente;

  const template = templates.find((t) => t.id === templateId) ?? null;
  const atual = fila[0] ?? null;

  const mensagem = useMemo(() => {
    if (!atual || !template) return "";
    return aplicarVariaveis(
      template.corpo,
      contextoDaEmpresa(atual, { cidade: atual.cidade, nicho: atual.nicho, meuNome }),
    );
  }, [atual, template, meuNome]);

  const confirmarContato = useCallback(async (item: ItemFila) => {
    setProcessando(true);
    const resposta = await marcarContatadoFila(item.id);
    setProcessando(false);
    setPendente(null);

    if (resposta.ok) {
      setFila((atual) => atual.filter((e) => e.id !== item.id));
      setAviso({ tipo: "sucesso", texto: `${item.nome} marcado como contatado.`, empresa: item });
      setTimeout(() => setAviso((a) => (a?.empresa?.id === item.id ? null : a)), 6000);
    } else {
      setAviso({ tipo: "erro", texto: resposta.erro ?? "Não foi possível marcar como contatado." });
    }
  }, []);

  // Ao voltar pra aba (foco ou visibilidade), confirma o contato do item pendente.
  useEffect(() => {
    function aoRetornar() {
      if (document.visibilityState !== "visible") return;
      const item = pendenteRef.current;
      if (item) confirmarContato(item);
    }

    window.addEventListener("focus", aoRetornar);
    document.addEventListener("visibilitychange", aoRetornar);
    return () => {
      window.removeEventListener("focus", aoRetornar);
      document.removeEventListener("visibilitychange", aoRetornar);
    };
  }, [confirmarContato]);

  function enviarMensagem() {
    if (!atual || !atual.whatsapp_e164) return;
    setAviso(null);
    window.open(linkWaMe(atual.whatsapp_e164, mensagem), "_blank", "noopener,noreferrer");
    setPendente(atual);
  }

  async function desfazer(item: ItemFila) {
    setProcessando(true);
    const resposta = await desfazerContatadoFila(item.id);
    setProcessando(false);
    if (resposta.ok) {
      setFila((atual) => [item, ...atual]);
      setAviso(null);
    }
  }

  if (fila.length === 0) {
    return (
      <div className="cartao px-6 py-14 text-center">
        <span className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-900">Fila vazia</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          Nenhuma empresa com WhatsApp verificado esperando contato agora. Rode uma nova varredura —
          empresas com celular em formato válido entram aqui automaticamente.
        </p>
        <Link href="/app/buscar" className="botao-primario mt-6">
          Fazer uma varredura
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <div>
        {templates.length > 0 && (
          <div className="cartao mb-4 p-4">
            <label className="rotulo" htmlFor="fila-template">
              Template da mensagem
            </label>
            <select
              id="fila-template"
              className="campo"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={Boolean(pendente)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {aviso && (
          <div
            className={`anim-entrada mb-4 flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm ${
              aviso.tipo === "sucesso" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
            role="status"
          >
            <span>{aviso.texto}</span>
            {aviso.tipo === "sucesso" && aviso.empresa && (
              <button
                type="button"
                onClick={() => desfazer(aviso.empresa!)}
                className="shrink-0 font-semibold underline"
              >
                Desfazer
              </button>
            )}
          </div>
        )}

        {pendente ? (
          <div className="cartao flex flex-col items-center gap-3 p-8 text-center">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-marca-200 border-t-marca-600" />
            <p className="text-sm font-semibold text-slate-900">
              Aguardando você voltar da conversa com {pendente.nome}…
            </p>
            <p className="text-xs text-slate-500">
              Assim que você voltar pra essa aba, marcamos como contatado automaticamente.
            </p>
            <button
              type="button"
              onClick={() => setPendente(null)}
              className="mt-1 text-xs font-medium text-slate-500 hover:underline"
            >
              Cancelar, não marcar
            </button>
          </div>
        ) : atual ? (
          /* Bloco dominante da tela: é o único lead que importa agora. */
          <div className="cartao-acao cartao-acao--verde">
            <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5">
              <span className="font-titulo text-[11.5px] font-extrabold tracking-wider text-acento-600">
                AGORA
              </span>
              <span className="ml-auto text-[11.5px] font-semibold text-acento-600">
                1 de {fila.length}
              </span>
            </div>

            <div className="p-5">
              <h2 className="font-titulo text-xl font-bold text-slate-900">{atual.nome}</h2>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">{atual.telefone}</span>
                <SeloPrioridade prioridade={atual.prioridade} />
              </div>
              {atual.endereco && <p className="mt-1.5 text-sm text-slate-600">{atual.endereco}</p>}

              {mensagem && (
                <div className="mt-4">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Mensagem que vai abrir
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                    {mensagem}
                  </pre>
                </div>
              )}

              <button
                type="button"
                onClick={enviarMensagem}
                disabled={processando || !template}
                className="botao-primario mt-4 w-full !bg-acento-600 !py-3.5 text-base hover:!bg-emerald-700"
              >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.44 1.32 4.94L2 22l5.24-1.38a9.9 9.9 0 0 0 4.8 1.22h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.87 14.24c-.25.7-1.45 1.34-2 1.42-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.3-5.07-4.5-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.05-2.49.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.28 1.66 2.07 1.14 1.02 2.1 1.34 2.4 1.5.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.07.13.07.75-.18 1.45Z" />
              </svg>
                {!template ? "Crie um template para começar" : "Abrir WhatsApp"}
              </button>

              <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-slate-500">
                Você envia com a mão. Ao voltar pra cá, marcamos como contatado e a fila anda
                sozinha.
              </p>

              {!template && (
                <p className="mt-2 text-xs text-slate-500">
                  <Link href="/app/templates" className="font-semibold text-marca-700 hover:underline">
                    Criar um template
                  </Link>{" "}
                  de canal WhatsApp para liberar o envio.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Peso leve de propósito: a fila é contexto, não a ação da vez. */}
      <div>
        <div className="mb-2 flex items-center gap-3">
          <h3 className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">
            Próximos
          </h3>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11.5px] text-slate-400">{fila.length} na fila</span>
        </div>
        <ul className="lista-filetes">
          {fila.slice(pendente ? 0 : 1, 8).map((item, indice) => (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <span className="w-4 shrink-0 font-titulo text-xs font-extrabold text-slate-300">
                {indice + 2}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{item.nome}</p>
                <p className="truncate text-xs text-slate-400">{item.telefone}</p>
              </div>
              <SeloPrioridade prioridade={item.prioridade} />
            </li>
          ))}
          {fila.length > 8 && (
            <li className="py-2.5 text-center text-xs text-slate-400">
              +{fila.length - 8} na fila
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
