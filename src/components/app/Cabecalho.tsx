export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        {descricao && <p className="mt-1 max-w-2xl text-sm text-slate-600">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}

export function EstadoVazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="cartao flex flex-col items-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-marca-50 text-marca-600">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5.5 12.5L21 21" strokeLinecap="round" />
        </svg>
      </span>
      <h2 className="mt-4 text-base font-bold text-slate-900">{titulo}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-600">{descricao}</p>
      {acao && <div className="mt-6">{acao}</div>}
    </div>
  );
}
