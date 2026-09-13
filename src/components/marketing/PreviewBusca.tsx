"use client";

import Link from "next/link";
import { useState } from "react";

const SEGMENTOS = [
  {
    id: "clinicas",
    rotulo: "Clínicas",
    nicho: "clínica odontológica",
    resultados: [
      { nome: "Clínica Sorriso Real", nota: 4.8, avaliacoes: 12, site: false, insta: true },
      { nome: "Odonto Vida Centro", nota: 4.2, avaliacoes: 7, site: false, insta: false },
      { nome: "Espaço Dental Norte", nota: 4.6, avaliacoes: 24, site: true, insta: true },
      { nome: "Instituto Odontológico Sul", nota: 4.9, avaliacoes: 138, site: true, insta: true },
    ],
  },
  {
    id: "academias",
    rotulo: "Academias",
    nicho: "academia de musculação",
    resultados: [
      { nome: "Force Studio Fit", nota: 4.7, avaliacoes: 9, site: false, insta: true },
      { nome: "Academia Corpo Ativo", nota: 4.1, avaliacoes: 5, site: false, insta: false },
      { nome: "Box Cross Centro", nota: 4.8, avaliacoes: 41, site: true, insta: true },
      { nome: "Vita Fitness Club", nota: 4.5, avaliacoes: 96, site: true, insta: true },
    ],
  },
  {
    id: "imobiliarias",
    rotulo: "Imobiliárias",
    nicho: "imobiliária",
    resultados: [
      { nome: "Imobiliária Novo Lar", nota: 4.4, avaliacoes: 8, site: false, insta: false },
      { nome: "Prime Imóveis", nota: 4.6, avaliacoes: 16, site: false, insta: true },
      { nome: "Casa & Cia Negócios", nota: 4.3, avaliacoes: 33, site: true, insta: true },
      { nome: "Terra Firme Imóveis", nota: 4.9, avaliacoes: 210, site: true, insta: true },
    ],
  },
];

function prioridade(r: { site: boolean; avaliacoes: number; insta: boolean }) {
  if (!r.site) return { rotulo: "Alta", classe: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" };
  if (r.avaliacoes < 10)
    return { rotulo: "Média-alta", classe: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" };
  if (!r.insta) return { rotulo: "Média", classe: "bg-sky-50 text-sky-700 ring-1 ring-sky-200" };
  return { rotulo: "Baixa", classe: "bg-slate-100 text-slate-600 ring-1 ring-slate-200" };
}

export function PreviewBusca() {
  const [segmentoId, setSegmentoId] = useState(SEGMENTOS[0].id);
  const [cidade, setCidade] = useState("Campinas — SP");

  const segmento = SEGMENTOS.find((s) => s.id === segmentoId) ?? SEGMENTOS[0];
  const semSite = segmento.resultados.filter((r) => !r.site).length;

  return (
    <div className="cartao overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="rotulo" htmlFor="preview-segmento">
              Segmento
            </label>
            <select
              id="preview-segmento"
              className="campo"
              value={segmentoId}
              onChange={(e) => setSegmentoId(e.target.value)}
            >
              {SEGMENTOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="preview-cidade">
              Cidade ou região
            </label>
            <input
              id="preview-cidade"
              className="campo"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              placeholder="Campinas — SP"
            />
          </div>
          <div className="flex items-end">
            <Link href="/auth?modo=cadastro" className="botao-primario w-full sm:w-auto">
              Fazer uma varredura gratuita
            </Link>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Prévia ilustrativa. Ao criar sua conta, a varredura roda de verdade na base do Google —
          sem limite de resultados e sem limite de buscas.
        </p>
      </div>

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold text-slate-900">
            {segmento.nicho} em {cidade || "sua cidade"}
          </span>
          <span className="text-slate-500">
            {segmento.resultados.length} empresas · {semSite} sem site
          </span>
        </div>

        <ul className="space-y-2.5">
          {segmento.resultados.map((r) => {
            const p = prioridade(r);
            return (
              <li
                key={r.nome}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">
                  {r.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{r.nome}</p>
                  <p className="truncate text-xs text-slate-500">
                    ★ {r.nota.toFixed(1)} ({r.avaliacoes} avaliações) ·{" "}
                    {r.site ? "com site" : "sem site"} ·{" "}
                    {r.insta ? "Instagram encontrado" : "sem Instagram"}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.classe}`}>
                  {p.rotulo}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
