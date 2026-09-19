"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adicionarLead, removerLead } from "@/app/app/acoes";
import {
  desfazerContato,
  idsPendentes,
  marcarContato,
  reenviarPendentes,
} from "@/lib/fila-pendente";
import { SeloPrioridade } from "./SeloPrioridade";
import { SeloStatus } from "./SeloStatus";
import { aplicarVariaveis, contextoDaEmpresa } from "@/lib/templates";
import { linkWaMe } from "@/lib/whatsapp";
import type { Empresa, LeadStatus, Template } from "@/lib/types";

export type ItemFila = Pick<
  Empresa,
  | "id"
  | "nome"
  | "endereco"
  | "telefone"
  | "nota"
  | "total_avaliacoes"
  | "instagram"
  | "website"
  | "prioridade"
> & {
  /** Sempre preenchido: sem celular válido o lead nem entra na fila. */
  whatsapp_e164: string;
  /** Lead correspondente no funil — é ele que avança de status. */
  leadId: string;
  leadStatus: LeadStatus;
  scoreRadar: number;
  nicho: string | null;
  cidade: string | null;
};

/** Item removido da fila que ainda dá para trazer de volta. */
type Desfazivel = {
  item: ItemFila;
  posicao: number;
  /** "enviado" volta a marcação de contato; "descartado" recria o lead. */
  tipo: "enviado" | "descartado";
};

const SEGUNDOS_PARA_DESFAZER = 8;

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
  const [desfazivel, setDesfazivel] = useState<Desfazivel | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviados, setEnviados] = useState(0);
  const [verTodos, setVerTodos] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const template = templates.find((t) => t.id === templateId) ?? null;
  const atual = fila[0] ?? null;

  const mensagem = useMemo(() => {
    if (!atual || !template) return "";
    return aplicarVariaveis(
      template.corpo,
      contextoDaEmpresa(atual, { cidade: atual.cidade, nicho: atual.nicho, meuNome }),
    );
  }, [atual, template, meuNome]);

  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  /**
   * Ao abrir a tela: esconde na hora os leads cuja marcação ainda não foi
   * confirmada pelo servidor e tenta entregá-las de novo. É isto que impede
   * o lead já contatado de reaparecer quando você fecha e abre o site.
   */
  useEffect(() => {
    const pendentes = idsPendentes();
    if (pendentes.length > 0) {
      const esconder = new Set(pendentes);
      setFila((lista) => lista.filter((e) => !esconder.has(e.id)));
    }
    void reenviarPendentes();
  }, []);

  /** Repõe um item na posição em que ele estava, sem duplicar. */
  const repor = useCallback(({ item, posicao }: Desfazivel) => {
    setFila((atual) => {
      if (atual.some((e) => e.id === item.id)) return atual;
      const copia = [...atual];
      copia.splice(Math.min(posicao, copia.length), 0, item);
      return copia;
    });
  }, []);

  function agendarLimpezaDoDesfazer() {
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setDesfazivel(null), SEGUNDOS_PARA_DESFAZER * 1000);
  }

  /**
   * Abre o WhatsApp e avança NA HORA.
   *
   * A versão anterior esperava você voltar para a aba (evento `focus` /
   * `visibilitychange`) para só então chamar o servidor e trocar de lead. No
   * celular esse evento falha com frequência — daí a sensação de travamento e
   * a necessidade de clicar duas vezes. Agora a fila anda no clique e a
   * gravação acontece por trás; se ela falhar, o lead volta sozinho.
   */
  function enviarMensagem() {
    if (!atual) return;

    setErro(null);
    window.open(linkWaMe(atual.whatsapp_e164, mensagem), "_blank", "noopener,noreferrer");

    const item = atual;
    setFila((lista) => lista.filter((e) => e.id !== item.id));
    setEnviados((n) => n + 1);
    setDesfazivel({ item, posicao: 0, tipo: "enviado" });
    agendarLimpezaDoDesfazer();

    // `marcarContato` grava na caixa de saída ANTES de tentar a rede e usa
    // keepalive: mesmo que o WhatsApp roube o foco e o navegador descarte a
    // página, a marcação chega — e, se não chegar, volta no próximo abrir.
    void marcarContato(item.id, item.leadId).then((ok) => {
      if (!ok) {
        // Fica pendente na caixa de saída: o lead não volta pra fila agora,
        // senão a pessoa mandaria mensagem duas vezes para o mesmo contato.
        setErro(
          "Sem conexão para confirmar o contato. Ele foi guardado e será registrado assim que a internet voltar.",
        );
      }
    });
  }

  /** Manda o lead para o fim da fila, sem marcar nada no banco. */
  function pular() {
    if (!atual || fila.length < 2) return;
    setErro(null);
    setFila((lista) => [...lista.slice(1), lista[0]]);
  }

  /**
   * Descarta o lead: sai da fila E do funil.
   *
   * Como a fila É o funil, remover daqui tem de remover de lá — senão o lead
   * sumiria da tela mas voltaria no próximo carregamento. A empresa continua
   * nos resultados da varredura, então dá para mandar de novo pro funil
   * depois se mudar de ideia.
   */
  function descartar(alvo: ItemFila) {
    setErro(null);
    const posicao = fila.findIndex((e) => e.id === alvo.id);
    setFila((lista) => lista.filter((e) => e.id !== alvo.id));
    setDesfazivel({ item: alvo, posicao: Math.max(0, posicao), tipo: "descartado" });
    agendarLimpezaDoDesfazer();

    void removerLead(alvo.leadId).then((resposta) => {
      if (!resposta.ok) {
        setErro(resposta.erro ?? "Não foi possível descartar esse lead.");
        setDesfazivel((atual) => (atual?.item.id === alvo.id ? null : atual));
        repor({ item: alvo, posicao: Math.max(0, posicao), tipo: "descartado" });
      }
    });
  }

  function desfazer() {
    const alvo = desfazivel;
    if (!alvo) return;
    setDesfazivel(null);
    repor(alvo);

    if (alvo.tipo === "enviado") {
      setEnviados((n) => Math.max(0, n - 1));
      void desfazerContato(alvo.item.id, alvo.item.leadId).then((ok) => {
        if (!ok) setErro("Não foi possível desfazer agora.");
      });
      return;
    }

    // O lead foi apagado do funil: desfazer significa criá-lo de novo. Ele
    // volta com outro id, então a lista precisa do id novo para o próximo
    // envio funcionar.
    void adicionarLead(alvo.item.id).then((resposta) => {
      if (!resposta.ok || !resposta.id) {
        setErro(resposta.erro ?? "Não foi possível trazer o lead de volta.");
        setFila((lista) => lista.filter((e) => e.id !== alvo.item.id));
        return;
      }
      const novoId = resposta.id;
      setFila((lista) =>
        lista.map((e) => (e.id === alvo.item.id ? { ...e, leadId: novoId, leadStatus: "novo" } : e)),
      );
    });
  }

  if (!atual) {
    return (
      <div className="cartao px-6 py-14 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-4 text-base font-bold text-slate-900">
          {enviados > 0 ? "Fila zerada" : "Nenhum lead esperando mensagem"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-600">
          {enviados > 0
            ? `Você abriu ${enviados} conversa${enviados === 1 ? "" : "s"} agora. Envie mais leads para o funil quando quiser continuar.`
            : "Esta fila é o seu funil. Vá aos resultados de uma varredura ou ao Radar, marque as empresas que interessam e clique em “Enviar para o funil” — quem tiver celular válido aparece aqui."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/app/radar" className="botao-primario">
            Abrir o Radar
          </Link>
          <Link href="/app/buscar" className="botao-secundario">
            Fazer uma varredura
          </Link>
        </div>

        {desfazivel && (
          <button type="button" onClick={desfazer} className="mt-5 text-sm font-semibold text-marca-700 hover:underline">
            Desfazer o último envio ({desfazivel.item.nome})
          </button>
        )}
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
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {erro && (
          <p className="anim-entrada mb-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
            {erro}
          </p>
        )}

        {desfazivel && (
          <div
            className={`anim-entrada mb-4 flex items-center justify-between gap-3 rounded-lg px-3.5 py-2.5 text-sm ${
              desfazivel.tipo === "enviado"
                ? "bg-emerald-50 text-emerald-800"
                : "bg-slate-100 text-slate-700"
            }`}
            role="status"
          >
            <span className="min-w-0 truncate">
              <strong className="font-semibold">{desfazivel.item.nome}</strong>{" "}
              {desfazivel.tipo === "enviado" ? "marcado como contatado." : "saiu da fila e do funil."}
            </span>
            <button type="button" onClick={desfazer} className="shrink-0 font-semibold underline">
              Desfazer
            </button>
          </div>
        )}

        {/* Bloco dominante da tela: é o único lead que importa agora. */}
        <div className="cartao-acao cartao-acao--verde">
          <div className="flex items-center gap-2 border-b border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <span className="font-titulo text-[11.5px] font-extrabold tracking-wider text-acento-600">
              AGORA
            </span>
            <span className="ml-auto text-[11.5px] font-semibold text-acento-600">
              {enviados > 0 && `${enviados} enviada${enviados === 1 ? "" : "s"} · `}
              {fila.length} na fila
            </span>
          </div>

          <div className="p-5">
            <h2 className="font-titulo text-xl font-bold text-slate-900">{atual.nome}</h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">{atual.telefone}</span>
              <SeloStatus
                sinais={{ lead_id: atual.leadId, lead_status: atual.leadStatus, contatado_fila_em: null }}
              />
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
              disabled={!template}
              className="botao-primario mt-4 w-full !bg-acento-600 !py-3.5 text-base hover:!bg-emerald-700"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.44 1.32 4.94L2 22l5.24-1.38a9.9 9.9 0 0 0 4.8 1.22h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm5.87 14.24c-.25.7-1.45 1.34-2 1.42-.51.08-1.16.11-1.87-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.3-5.07-4.5-.15-.2-1.22-1.62-1.22-3.09 0-1.47.77-2.19 1.05-2.49.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.6.17.3.77 1.28 1.66 2.07 1.14 1.02 2.1 1.34 2.4 1.5.3.15.47.12.65-.07.17-.2.75-.87.95-1.17.2-.3.4-.25.67-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.07.13.07.75-.18 1.45Z" />
              </svg>
              {!template ? "Crie um template para começar" : "Abrir WhatsApp e avançar"}
            </button>

            <div className="mt-2 flex gap-2">
              {fila.length > 1 && (
                <button
                  type="button"
                  onClick={pular}
                  className="flex-1 rounded-lg py-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                >
                  Pular — volta pro fim
                </button>
              )}
              <button
                type="button"
                onClick={() => descartar(atual)}
                className="flex-1 rounded-lg py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
              >
                Descartar — tira do funil
              </button>
            </div>

            <p className="mt-2.5 text-center text-[11.5px] leading-relaxed text-slate-500">
              Você envia com a mão. A fila já pula pro próximo no clique.
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
        {fila.length === 1 ? (
          <p className="py-3 text-sm text-slate-500">Esse é o último da fila.</p>
        ) : (
          <ul className="lista-filetes">
            {fila.slice(1, verTodos ? undefined : 8).map((item, indice) => (
              <li key={item.id} className="flex items-center gap-2.5 py-2.5">
                <span className="w-4 shrink-0 font-titulo text-xs font-extrabold text-slate-300">
                  {indice + 2}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{item.nome}</p>
                  <p className="truncate text-xs text-slate-400">{item.telefone}</p>
                </div>
                <SeloStatus
                  sinais={{ lead_id: item.leadId, lead_status: item.leadStatus, contatado_fila_em: null }}
                  curto
                />
                {/* Descarte direto da lista: dá para limpar a fila sem ter de
                    passar lead por lead até chegar no que você não quer. */}
                <button
                  type="button"
                  onClick={() => descartar(item)}
                  aria-label={`Descartar ${item.nome}`}
                  title="Descartar — tira da fila e do funil"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </li>
            ))}
            {fila.length > 8 && (
              <li className="py-2.5 text-center">
                <button
                  type="button"
                  onClick={() => setVerTodos((v) => !v)}
                  className="text-xs font-semibold text-marca-700 hover:underline"
                >
                  {verTodos ? "Mostrar só os próximos 7" : `Ver todos os ${fila.length - 1} da fila`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
