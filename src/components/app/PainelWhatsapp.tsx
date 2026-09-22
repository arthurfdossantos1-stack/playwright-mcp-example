"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Template } from "@/lib/types";

type Estado = {
  userId: string;
  /** O servidor deu sinal de vida nos últimos segundos? */
  servidorVivo: boolean;
  vistoEm: string | null;
  conectado: boolean;
  numero: string | null;
  qr: string | null;
  comandoPendente: string | null;
  enviadasHoje: number;
  tetoHoje: number;
  campanha: {
    estado: "pendente" | "rodando" | "pausado" | "concluido" | "cancelado";
    total: number;
    enviados: number;
    pulados: number;
    falhas: number;
  } | null;
};

const ROTULO_CAMPANHA: Record<string, string> = {
  pendente: "Aguardando o servidor pegar",
  rodando: "Disparando…",
  pausado: "Disparo pausado",
  concluido: "Disparo concluído",
  cancelado: "Disparo cancelado",
};

export function PainelWhatsapp({ templates }: { templates: Template[] }) {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.canal === "whatsapp")?.id ?? templates[0]?.id ?? "",
  );
  const [quantidade, setQuantidade] = useState(20);
  const [intervalo, setIntervalo] = useState<[number, number]>([45, 90]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  /** Quando o pedido de QR saiu daqui, para medir a espera. */
  const [pedidoEm, setPedidoEm] = useState<number | null>(null);

  const consultar = useCallback(async () => {
    try {
      const r = await fetch("/api/whatsapp", { cache: "no-store" });
      setEstado((await r.json()) as Estado);
    } catch {
      /* rede instável: mantém o último estado conhecido */
    }
  }, []);

  useEffect(() => {
    void consultar();
    // Enquanto há QR na tela ou disparo rodando, o estado muda sozinho.
    const id = setInterval(consultar, 4000);
    return () => clearInterval(id);
  }, [consultar]);

  // O QR chegou, ou a conexao abriu de primeira com a sessao salva: acabou.
  useEffect(() => {
    if (estado?.qr || estado?.conectado) setPedidoEm(null);
  }, [estado?.qr, estado?.conectado]);

  async function acao(caminho: string, metodo: "POST" | "DELETE", corpo?: unknown) {
    setOcupado(true);
    setAviso(null);
    try {
      const r = await fetch(caminho, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: corpo ? JSON.stringify(corpo) : undefined,
      });
      const dados = (await r.json()) as { erro?: string; total?: number };
      if (!r.ok) setAviso(dados.erro ?? "Não deu certo.");
      else if (dados.total) setAviso(`Disparo iniciado para ${dados.total} lead(s).`);
      await consultar();
    } catch {
      setAviso("Falha de conexão.");
    } finally {
      setOcupado(false);
    }
  }

  const campanha = estado?.campanha;

  /**
   * O pedido nao e uma chamada: ele fica gravado e o servidor pega na
   * proxima consulta. Sao tres esperas somadas — ate 8s ate o servidor
   * perguntar, ~2s ate o WhatsApp devolver o codigo, ate 8s ate ele
   * publicar e 4s ate esta tela ler. Sem dizer isso, os 20 segundos
   * parecem o botao nao ter funcionado.
   */
  const esperandoQr = pedidoEm !== null && !estado?.qr && !estado?.conectado;
  const segundosEsperando = pedidoEm ? Math.round((Date.now() - pedidoEm) / 1000) : 0;

  const rodando = campanha?.estado === "rodando" || campanha?.estado === "pendente";

  return (
    <div className="space-y-5">
      {/* O risco não fica escondido num rodapé: é a primeira coisa da tela. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-sm font-bold text-amber-900">Use um chip descartável</h2>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-amber-900">
          <li>
            Isto usa uma conexão <strong>não oficial</strong> com o WhatsApp e viola os termos de
            uso. O banimento é do número e costuma ser permanente.
          </li>
          <li>
            Nunca conecte seu número pessoal ou o da empresa. Se for banido, você perde as
            conversas daquele número.
          </li>
          <li>
            O teto do dia sobe aos poucos ({estado?.enviadasHoje ?? 0} de {estado?.tetoHoje ?? 20}{" "}
            hoje). Chip novo disparando no volume máximo é banido quase na hora.
          </li>
        </ul>
      </div>

      <div className="cartao p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">Servidor</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {estado?.servidorVivo
                ? "No ar e perguntando por trabalho."
                : estado?.vistoEm
                  ? "Parou de dar sinal. Se está no Termux, o Android provavelmente matou o processo — reabra e rode npm start."
                  : "Nunca deu sinal. Suba a pasta servidor-whatsapp/ seguindo o README e ele aparece aqui sozinho."}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
              estado?.servidorVivo
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
          >
            {estado?.servidorVivo ? "No ar" : "Fora do ar"}
          </span>
        </div>

        {estado?.userId && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              Seu <strong>USUARIO_ID</strong> para configurar o servidor:
            </p>
            <code className="mt-1 block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              {estado.userId}
            </code>
          </div>
        )}
      </div>

      <div className="cartao p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Conexão</h2>
            <p className="mt-1 text-sm text-slate-600">
              {estado?.conectado
                ? `Conectado${estado.numero ? ` como ${estado.numero}` : ""}.`
                : "Nenhum número conectado."}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
              estado?.conectado
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                : "bg-slate-100 text-slate-600 ring-slate-200"
            }`}
          >
            {estado?.conectado ? "Conectado" : "Desconectado"}
          </span>
        </div>



        {esperandoQr && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Pedindo o código ao servidor…</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              O servidor pergunta por trabalho a cada 8 segundos, então o código leva até uns 20
              para aparecer aqui. Pode deixar esta tela aberta.
            </p>
            {segundosEsperando > 45 && (
              <p className="mt-2 text-sm text-amber-800">
                Está demorando mais que o normal. Olhe o terminal do servidor — se ele parou, rode{" "}
                <code className="font-semibold">npm start</code> de novo.
              </p>
            )}
          </div>
        )}

        {!estado?.servidorVivo && !estado?.conectado && (
          <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
            O servidor precisa estar no ar para gerar o código — quem fala com o WhatsApp é ele,
            não o site.
          </p>
        )}

        {estado?.qr && !estado.conectado && (
          <div className="mt-4">
            <p className="mb-2 text-sm text-slate-600">
              No celular: WhatsApp → Configurações → <strong>Aparelhos conectados</strong> →
              Conectar um aparelho. Aponte para o código abaixo.
            </p>
            <div className="flex justify-center rounded-xl border border-slate-200 bg-white p-4">
              <Image src={estado.qr} alt="QR Code do WhatsApp" width={280} height={280} unoptimized />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              O código troca sozinho a cada poucos segundos. A tela atualiza junto.
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {estado?.conectado ? (
            <button
              type="button"
              onClick={() => acao("/api/whatsapp/conexao", "POST", { acao: "desconectar" })}
              disabled={ocupado}
              className="botao-secundario !py-2 !text-sm"
            >
              Desconectar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setPedidoEm(Date.now());
                void acao("/api/whatsapp/conexao", "POST", { acao: "conectar" });
              }}
              disabled={ocupado || !estado?.servidorVivo}
              className="botao-primario !py-2 !text-sm"
            >
              {ocupado ? "…" : esperandoQr ? "Pedindo o código…" : "Gerar QR Code"}
            </button>
          )}
        </div>
      </div>

      <div className="cartao p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900">Disparo para o funil</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Envia para os leads do funil com celular válido que ainda não receberam mensagem, do
          maior score para o menor.
        </p>

        {templates.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Você precisa de um template primeiro.{" "}
            <Link href="/app/templates" className="font-semibold text-marca-700 hover:underline">
              Criar um template
            </Link>
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="rotulo" htmlFor="template">
                  Template
                </label>
                <select
                  id="template"
                  className="campo !py-2 !text-sm"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  disabled={rodando}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="rotulo" htmlFor="quantidade">
                  Quantos leads
                </label>
                <select
                  id="quantidade"
                  className="campo !py-2 !text-sm"
                  value={quantidade}
                  onChange={(e) => setQuantidade(Number(e.target.value))}
                  disabled={rodando}
                >
                  {[10, 20, 30, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} leads
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="rotulo" htmlFor="intervalo">
                Intervalo entre mensagens
              </label>
              <select
                id="intervalo"
                className="campo !py-2 !text-sm"
                value={intervalo.join("-")}
                onChange={(e) => {
                  const [a, b] = e.target.value.split("-").map(Number);
                  setIntervalo([a, b]);
                }}
                disabled={rodando}
              >
                <option value="45-90">45 a 90 segundos (recomendado)</option>
                <option value="90-180">90 a 180 segundos (mais seguro)</option>
                <option value="25-50">25 a 50 segundos (arriscado)</option>
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                O intervalo é sorteado dentro da faixa a cada envio. Cadência regular é o que
                denuncia robô — por isso não existe opção de intervalo fixo.
              </p>
            </div>

            {campanha && (
              <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="font-semibold text-slate-900">
                    {ROTULO_CAMPANHA[campanha.estado] ?? campanha.estado}
                  </span>
                  <span className="text-slate-600">
                    {campanha.enviados} de {campanha.total} enviadas
                  </span>
                  {campanha.pulados > 0 && (
                    <span className="text-slate-500">{campanha.pulados} sem WhatsApp</span>
                  )}
                  {campanha.falhas > 0 && (
                    <span className="text-rose-700">{campanha.falhas} falharam</span>
                  )}
                </div>
                {campanha.estado === "pausado" && (
                  <p className="mt-1.5 text-sm text-amber-800">
                    O servidor pausou — normalmente é a conexão caindo ou o teto do dia. Ele
                    retoma sozinho quando reconectar.
                  </p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-acento-500 transition-all"
                    style={{
                      width: `${campanha.total ? (campanha.enviados / campanha.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {aviso && (
              <p className="mt-3 rounded-lg bg-slate-100 px-3.5 py-2.5 text-sm text-slate-700" role="status">
                {aviso}
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {rodando ? (
                <button
                  type="button"
                  onClick={() => acao("/api/whatsapp/disparo", "DELETE")}
                  disabled={ocupado}
                  className="botao-secundario !py-2 !text-sm"
                >
                  Parar agora
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    acao("/api/whatsapp/disparo", "POST", {
                      templateId,
                      quantidade,
                      intervaloMin: intervalo[0],
                      intervaloMax: intervalo[1],
                    })
                  }
                  disabled={ocupado || !estado?.conectado || !templateId}
                  className="botao-primario !py-2 !text-sm"
                >
                  {ocupado ? "…" : "Começar disparo"}
                </button>
              )}
              <Link href="/app/enviar-mensagem" className="botao-secundario !py-2 !text-sm">
                Enviar na mão
              </Link>
            </div>

            {!estado?.conectado && (
              <p className="mt-2 text-xs text-slate-500">
                {estado?.servidorVivo
                  ? "Conecte um número para liberar o disparo."
                  : "O servidor precisa estar no ar para disparar."}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
