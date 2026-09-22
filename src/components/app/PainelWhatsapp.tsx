"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Template } from "@/lib/types";

type Estado = {
  configurado: boolean;
  conectado?: boolean;
  numero?: string | null;
  qr?: string | null;
  tetoHoje?: number;
  enviadasHoje?: number;
  campanha?: {
    estado: "rodando" | "parada" | "concluida";
    motivo: string | null;
    total: number;
    enviados: number;
    pulados: number;
    falhas: number;
  } | null;
  erro?: string;
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

  if (estado && !estado.configurado) {
    return (
      <div className="cartao p-6">
        <h2 className="text-base font-bold text-slate-900">Servidor não configurado</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          O disparo automático precisa de um servidor ligado 24 horas — a Netlify não mantém a
          sessão do WhatsApp aberta. O código está na pasta{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">servidor-whatsapp/</code> do
          repositório, com as instruções de como subir.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Depois de subir, configure <strong>WHATSAPP_WORKER_URL</strong> e{" "}
          <strong>WHATSAPP_WORKER_SECRET</strong> na Netlify.
        </p>
      </div>
    );
  }

  const campanha = estado?.campanha;
  const rodando = campanha?.estado === "rodando";

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

        {estado?.erro && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
            {estado.erro}
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
              onClick={() => acao("/api/whatsapp/conexao", "POST", { acao: "conectar" })}
              disabled={ocupado}
              className="botao-primario !py-2 !text-sm"
            >
              {ocupado ? "…" : "Gerar QR Code"}
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
                    {campanha.estado === "rodando"
                      ? "Disparando…"
                      : campanha.estado === "concluida"
                        ? "Disparo concluído"
                        : "Disparo parado"}
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
                {campanha.motivo && (
                  <p className="mt-1.5 text-sm text-amber-800">Motivo: {campanha.motivo}</p>
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
              <p className="mt-2 text-xs text-slate-500">Conecte um número para liberar o disparo.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
