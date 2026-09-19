"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { devolverContatadosAFila } from "@/app/app/acoes";

/**
 * Ponte entre o funil e o envio de mensagens.
 *
 * O funil e a fila são a mesma lista — quem entra aqui já aparece lá. Este
 * bloco existe porque isso não era óbvio na tela: ele mostra quantos estão
 * prontos, quantos ficam de fora e por quê, e leva direto para o envio.
 */
export function PainelEnvioFunil({
  prontos,
  semWhatsapp,
  jaContatados,
}: {
  prontos: number;
  semWhatsapp: number;
  jaContatados: number;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();
  const [aviso, setAviso] = useState<string | null>(null);

  function devolver() {
    setAviso(null);
    iniciar(async () => {
      const resposta = await devolverContatadosAFila();
      if (resposta.ok) {
        setAviso(
          `${resposta.total ?? 0} lead(s) voltaram para a fila de mensagens.`,
        );
        router.refresh();
      } else {
        setAviso(resposta.erro ?? "Não foi possível devolver à fila.");
      }
    });
  }

  return (
    <div className="cartao-acao cartao-acao--verde mb-5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-titulo text-base font-bold text-slate-900">
            {prontos > 0
              ? `${prontos} lead${prontos === 1 ? "" : "s"} pronto${prontos === 1 ? "" : "s"} para mensagem`
              : "Nenhum lead pronto para mensagem"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            {prontos > 0
              ? "Eles já estão na fila de envio, um por vez, com o texto do seu template pronto."
              : "Todo lead do funil com celular válido entra na fila automaticamente."}
            {semWhatsapp > 0 && (
              <>
                {" "}
                <span className="text-slate-500">
                  {semWhatsapp} fica{semWhatsapp === 1 ? "" : "m"} de fora por não ter celular
                  válido — esses você contata por telefone, e-mail ou Instagram.
                </span>
              </>
            )}
          </p>
        </div>

        <Link
          href="/app/enviar-mensagem"
          className="botao-primario shrink-0 !bg-acento-600 !px-4 !py-2.5 !text-sm hover:!bg-acento-500"
          aria-disabled={prontos === 0}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.44 1.32 4.94L2 22l5.24-1.38a9.9 9.9 0 0 0 4.8 1.22h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Z" />
          </svg>
          Ir para o envio de mensagens
        </Link>
      </div>

      {jaContatados > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3 text-sm">
          <span className="text-slate-600">
            {jaContatados} já receberam mensagem e saíram da fila.
          </span>
          <button
            type="button"
            onClick={devolver}
            disabled={pendente}
            className="font-semibold text-marca-700 hover:underline disabled:opacity-60"
          >
            {pendente ? "Devolvendo…" : `Devolver ${jaContatados} para a fila`}
          </button>
        </div>
      )}

      {aviso && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
          {aviso}
        </p>
      )}
    </div>
  );
}
