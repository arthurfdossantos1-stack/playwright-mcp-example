/**
 * Mockup do dashboard usado como imagem de apoio no hero e na demonstracao.
 * Construido em JSX/CSS (sem binario) para ficar nítido em qualquer tela.
 */

const EMPRESAS = [
  {
    nome: "Clínica Sorriso Real",
    bairro: "Cambuí · Campinas",
    nota: "4.8",
    avaliacoes: 12,
    selo: "Alta",
    cor: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    detalhe: "Sem site",
  },
  {
    nome: "Odonto Vida Centro",
    bairro: "Centro · Campinas",
    nota: "4.2",
    avaliacoes: 7,
    selo: "Alta",
    cor: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    detalhe: "Sem site · sem Instagram",
  },
  {
    nome: "Espaço Dental Norte",
    bairro: "Barão Geraldo · Campinas",
    nota: "4.6",
    avaliacoes: 24,
    selo: "Média-alta",
    cor: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    detalhe: "Poucas avaliações",
  },
  {
    nome: "Instituto Odontológico Sul",
    bairro: "Taquaral · Campinas",
    nota: "4.9",
    avaliacoes: 138,
    selo: "Baixa",
    cor: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
    detalhe: "Já bem posicionada",
  },
];

export function MockupDashboard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_-30px_rgb(15_23_42/0.45)] ${className}`}
      aria-hidden="true"
    >
      {/* barra da janela */}
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        <div className="ml-3 flex-1 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200">
          rastrolead.com.br/app/resultados
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[168px_1fr]">
        {/* sidebar */}
        <aside className="hidden border-r border-slate-200 bg-slate-50/70 p-4 sm:block">
          <div className="mb-5 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-marca-600 to-acento-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
                <circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M15.8 15.8 L20.5 20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-xs font-bold text-slate-900">RastroLead</span>
          </div>
          {[
            { rotulo: "Visão geral", ativo: false },
            { rotulo: "Nova varredura", ativo: false },
            { rotulo: "Resultados", ativo: true },
            { rotulo: "Radar", ativo: false },
            { rotulo: "Leads", ativo: false },
            { rotulo: "Templates", ativo: false },
            { rotulo: "Cadências", ativo: false },
          ].map((item) => (
            <div
              key={item.rotulo}
              className={`mb-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
                item.ativo ? "bg-marca-600 text-white" : "text-slate-500"
              }`}
            >
              {item.rotulo}
            </div>
          ))}
        </aside>

        {/* conteudo */}
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-[11px] font-medium text-slate-600">
              clínica odontológica · Campinas — SP
            </div>
            <div className="rounded-lg bg-marca-600 px-3 py-2 text-[11px] font-semibold text-white">
              Varrer
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { v: "47", r: "empresas" },
              { v: "19", r: "sem site" },
              { v: "12", r: "no radar" },
            ].map((kpi) => (
              <div key={kpi.r} className="rounded-lg border border-slate-200 bg-white p-2.5">
                <p className="text-base font-bold leading-none text-slate-900">{kpi.v}</p>
                <p className="mt-1 text-[10px] text-slate-500">{kpi.r}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {EMPRESAS.map((empresa) => (
              <div
                key={empresa.nome}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                  {empresa.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-slate-900">{empresa.nome}</p>
                  <p className="truncate text-[10px] text-slate-500">
                    {empresa.bairro} · ★ {empresa.nota} ({empresa.avaliacoes}) · {empresa.detalhe}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${empresa.cor}`}>
                  {empresa.selo}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mini kanban usado na secao "Acompanhe". */
export function MockupFunil({ className = "" }: { className?: string }) {
  const colunas = [
    { titulo: "Novo", cor: "bg-slate-400", itens: ["Clínica Sorriso Real", "Odonto Vida Centro"] },
    { titulo: "Contatado", cor: "bg-marca-500", itens: ["Espaço Dental Norte"] },
    { titulo: "Respondeu", cor: "bg-amber-400", itens: ["Dental Prime"] },
    { titulo: "Fechado", cor: "bg-acento-500", itens: ["OdontoCare Sul"] },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_-30px_rgb(15_23_42/0.4)] ${className}`}
      aria-hidden="true"
    >
      <div className="grid grid-cols-4 gap-2.5">
        {colunas.map((coluna) => (
          <div key={coluna.titulo} className="rounded-xl bg-slate-50 p-2">
            <div className="mb-2 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${coluna.cor}`} />
              <span className="text-[10px] font-semibold text-slate-600">{coluna.titulo}</span>
            </div>
            <div className="space-y-1.5">
              {coluna.itens.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[9.5px] font-medium leading-tight text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
