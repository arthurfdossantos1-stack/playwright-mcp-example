"use client";

import { useId, useState, useTransition } from "react";
import { adicionarLead, removerLead } from "@/app/app/acoes";
import { BotaoGerarPrevia } from "./PainelPrevia";
import { limparUrl } from "@/lib/format";
import { linkWhatsappEmpresa } from "@/lib/whatsapp";
import { CLASSES_PRIORIDADE } from "@/lib/radar";
import { statusDoLead, STATUS_LEAD } from "@/lib/status-lead";
import { PRIORIDADE_CURTA, type EmpresaRadar } from "@/lib/types";

/**
 * Uma empresa como LINHA de uma tabela, não como cartão.
 *
 * As quatro colunas (empresa, score, status, WhatsApp) ficam lado a lado e
 * alinhadas com as das outras linhas pela grade `.grade-lead`. Tudo que não
 * cabe numa linha de celular — endereço completo, telefone, site, Instagram,
 * motivos do Radar e os botões — fica no painel que abre ao tocar na linha.
 */
export function LinhaEmpresa({
  empresa,
  selecionavel = false,
  selecionada = false,
  aoSelecionar,
}: {
  empresa: EmpresaRadar;
  selecionavel?: boolean;
  selecionada?: boolean;
  aoSelecionar?: (id: string, marcado: boolean) => void;
}) {
  const [pendente, iniciar] = useTransition();
  const [leadId, setLeadId] = useState<string | null>(empresa.lead_id);
  const [erro, setErro] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const idPainel = useId();

  const noFunil = Boolean(leadId);

  function enviarParaFunil() {
    setErro(null);
    iniciar(async () => {
      const resposta = await adicionarLead(empresa.id);
      if (resposta.ok) setLeadId(resposta.id ?? null);
      else setErro(resposta.erro ?? "Não foi possível enviar para o funil.");
    });
  }

  function tirarDoFunil() {
    if (!leadId) return;
    setErro(null);
    iniciar(async () => {
      const resposta = await removerLead(leadId);
      if (resposta.ok) setLeadId(null);
      else setErro(resposta.erro ?? "Não foi possível remover do funil.");
    });
  }

  // O status acompanha o que o usuário acabou de fazer, sem esperar refresh.
  const status = statusDoLead({
    lead_id: leadId,
    lead_status: leadId ? (empresa.lead_status ?? "novo") : null,
    contatado_fila_em: empresa.contatado_fila_em,
  });
  const descricao = STATUS_LEAD[status];
  const whatsapp = linkWhatsappEmpresa(empresa);
  const ehInstagram = empresa.fonte === "instagram";

  return (
    <li className={aberto ? "bg-slate-50/60" : undefined}>
      <div className="grade-lead px-3 py-2 sm:px-4 sm:py-2.5">
        {selecionavel ? (
          <input
            type="checkbox"
            checked={selecionada}
            onChange={(e) => aoSelecionar?.(empresa.id, e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
            aria-label={`Selecionar ${empresa.nome}`}
          />
        ) : (
          <span />
        )}

        {/* Coluna 1: empresa. É o botão que abre os detalhes. */}
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls={idPainel}
          className="flex min-w-0 items-center gap-1.5 text-left"
        >
          <svg
            viewBox="0 0 20 20"
            aria-hidden="true"
            className={`h-3 w-3 shrink-0 fill-slate-400 transition-transform ${
              aberto ? "rotate-90" : ""
            }`}
          >
            <path d="M7 4l6 6-6 6V4Z" />
          </svg>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-900">
              {empresa.nome}
            </span>
            <span className="flex min-w-0 items-center gap-1 text-[11px] leading-tight text-slate-500">
              {ehInstagram && (
                <svg viewBox="0 0 24 24" aria-label="Instagram" className="h-3 w-3 shrink-0 fill-current text-violet-500">
                  <path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.82.91 1.38.17.44.37 1.06.42 2.24.06 1.28.07 1.66.07 4.89s0 3.6-.07 4.9c-.05 1.17-.25 1.79-.42 2.23-.22.56-.48.96-.9 1.38-.43.42-.83.68-1.39.9-.44.17-1.06.37-2.23.42-1.28.06-1.66.07-4.89.07s-3.6 0-4.9-.07c-1.17-.05-1.79-.25-2.23-.42-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.17-.44-.37-1.06-.42-2.24C2.21 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.17.25-1.79.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.44-.17 1.06-.37 2.24-.42C8.4 2.21 8.8 2.2 12 2.2Zm0 5.4a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Zm0 7.26a2.86 2.86 0 1 1 0-5.72 2.86 2.86 0 0 1 0 5.72Zm5.6-7.44a1.03 1.03 0 1 1-2.06 0 1.03 1.03 0 0 1 2.06 0Z" />
                </svg>
              )}
              <span className="truncate">
                {ehInstagram
                  ? [
                      empresa.instagram_username ? `@${empresa.instagram_username}` : null,
                      empresa.instagram_seguidores != null
                        ? `${empresa.instagram_seguidores.toLocaleString("pt-BR")} seguidores`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Perfil do Instagram"
                  : (empresa.endereco ?? empresa.categoria ?? "Sem endereço")}
              </span>
            </span>
          </span>
        </button>

        {/* Coluna 2: score do Radar, na cor da prioridade. */}
        <span
          className={`justify-self-center rounded-md px-1.5 py-1 text-center text-xs font-bold tabular-nums ring-1 ${
            CLASSES_PRIORIDADE[empresa.prioridade]
          }`}
          title={`Score ${empresa.score_radar} — prioridade ${PRIORIDADE_CURTA[
            empresa.prioridade
          ].toLowerCase()}`}
        >
          {empresa.score_radar}
        </span>

        {/* Coluna 3: status do lead. */}
        <span
          className={`inline-flex min-w-0 items-center gap-1 rounded-full px-1 py-1 text-[10px] font-semibold ring-1 sm:px-2.5 sm:text-[11px] ${descricao.classe}`}
          title={descricao.rotulo}
        >
          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${descricao.ponto}`} />
          <span className="truncate sm:hidden">{descricao.curto}</span>
          <span className="hidden truncate sm:inline">{descricao.rotulo}</span>
        </span>

        {/* Coluna 4: WhatsApp — sempre link manual wa.me, nunca envio automático. */}
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir WhatsApp de ${empresa.nome}`}
            className="inline-flex items-center justify-center gap-1.5 justify-self-center rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 sm:w-full"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-current">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.03c-.25.69-1.45 1.32-1.99 1.37-.53.05-1.03.24-3.47-.72-2.92-1.15-4.78-4.15-4.92-4.34-.14-.2-1.18-1.57-1.18-3s.75-2.13 1.02-2.42c.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.25.6.84 2.07.91 2.22.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.14-.3.3-.13.59.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.3 2.35 1.45.29.15.46.12.63-.07.17-.2.73-.85.92-1.14.2-.29.39-.24.66-.15.27.1 1.73.82 2.03.97.29.15.49.22.56.34.07.12.07.69-.18 1.38Z" />
            </svg>
            <span className="hidden sm:inline">Zap</span>
          </a>
        ) : (
          <span
            className="justify-self-center text-center text-[11px] text-slate-300 sm:w-full"
            title="Nenhum celular identificado nesse país"
          >
            —
          </span>
        )}
      </div>

      {aberto && (
        <div id={idPainel} className="anim-entrada border-t border-slate-100 px-3 py-3 sm:px-4">
          {/* Endereço completo: na linha ele aparece cortado. */}
          {empresa.endereco && (
            <p className="mb-3 text-sm text-slate-600">{empresa.endereco}</p>
          )}
          {empresa.instagram_bio && (
            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {empresa.instagram_bio}
            </p>
          )}

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-slate-400">
                {ehInstagram ? "Seguidores" : "Avaliações"}
              </dt>
              <dd className="truncate text-slate-700">
                {ehInstagram
                  ? (empresa.instagram_seguidores?.toLocaleString("pt-BR") ?? "—")
                  : empresa.nota != null
                    ? `${empresa.nota.toFixed(1)} (${empresa.total_avaliacoes})`
                    : "Sem avaliações"}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-slate-400">Telefone</dt>
              <dd className="truncate">
                {empresa.telefone ? (
                  <a href={`tel:${empresa.telefone}`} className="text-slate-700 hover:text-marca-700">
                    {empresa.telefone}
                  </a>
                ) : (
                  <span className="text-slate-400">Sem telefone</span>
                )}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-slate-400">Site</dt>
              <dd className="truncate">
                {empresa.website ? (
                  <a
                    href={empresa.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-marca-700 hover:underline"
                  >
                    {limparUrl(empresa.website)}
                  </a>
                ) : (
                  <span className="font-medium text-rose-700">Sem site</span>
                )}
              </dd>
            </div>

            <div className="min-w-0">
              <dt className="text-[11px] font-medium text-slate-400">Instagram</dt>
              <dd className="truncate">
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
                  <span className="text-slate-400">Não encontrado</span>
                )}
              </dd>
            </div>
          </dl>

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

          <div className="mt-3 flex flex-wrap gap-2">
            {noFunil ? (
              <button
                type="button"
                onClick={tirarDoFunil}
                disabled={pendente}
                className="botao-secundario !px-3 !py-1.5 !text-xs"
              >
                {pendente ? "…" : "Tirar do funil"}
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

            {!empresa.website && (
              <BotaoGerarPrevia empresaId={empresa.id} empresaNome={empresa.nome} />
            )}
          </div>

          {erro && <p className="mt-2 text-sm text-rose-700">{erro}</p>}
        </div>
      )}
    </li>
  );
}
