"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Projeto } from "@/lib/types";
import { PAISES, PAIS_PADRAO, acharPais } from "@/lib/paises";

export function FormularioBusca({
  projetos,
  projetoPadrao,
}: {
  projetos: Projeto[];
  projetoPadrao?: string | null;
}) {
  const router = useRouter();
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [pais, setPais] = useState(PAIS_PADRAO);
  const [projetoId, setProjetoId] = useState(projetoPadrao ?? "");
  const [carregando, setCarregando] = useState(false);
  const sugestoes = acharPais(pais).sugestoes;
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await fetch("/api/buscas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nicho, cidade, pais, projetoId: projetoId || null }),
      });

      const dados = (await resposta.json()) as { buscaId?: string; erro?: string };

      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível concluir a varredura.");
        setCarregando(false);
        return;
      }

      router.push(`/app/resultados/${dados.buscaId}`);
      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={aoEnviar} className="cartao p-6 sm:p-7">
      <div className="mb-4">
        <label className="rotulo" htmlFor="pais">
          País
        </label>
        <select
          id="pais"
          className="campo"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
          disabled={carregando}
        >
          {PAISES.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nome}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-slate-500">
          Define o idioma dos resultados e a regra de celular usada na fila de WhatsApp.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="nicho">
            Nicho ou tipo de negócio
          </label>
          <input
            id="nicho"
            className="campo"
            required
            minLength={2}
            value={nicho}
            onChange={(e) => setNicho(e.target.value)}
            placeholder={sugestoes[0]}
            list="sugestoes-nicho"
            disabled={carregando}
          />
          <datalist id="sugestoes-nicho">
            {sugestoes.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="rotulo" htmlFor="cidade">
            Cidade, bairro ou região
          </label>
          <input
            id="cidade"
            className="campo"
            required
            minLength={2}
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder={acharPais(pais).exemploCidade}
            disabled={carregando}
          />
        </div>
      </div>

      {projetos.length > 0 && (
        <div className="mt-4">
          <label className="rotulo" htmlFor="projeto">
            Projeto (opcional)
          </label>
          <select
            id="projeto"
            className="campo"
            value={projetoId}
            onChange={(e) => setProjetoId(e.target.value)}
            disabled={carregando}
          >
            <option value="">Sem projeto</option>
            {projetos.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {sugestoes.slice(0, 5).map((sugestao) => (
          <button
            key={sugestao}
            type="button"
            onClick={() => setNicho(sugestao)}
            disabled={carregando}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-marca-300 hover:bg-marca-50 hover:text-marca-700"
          >
            {sugestao}
          </button>
        ))}
      </div>

      {erro && (
        <p className="mt-5 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" disabled={carregando} className="botao-primario mt-6 w-full sm:w-auto">
        {carregando ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Varrendo empresas…
          </>
        ) : (
          <>
            Fazer varredura
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </>
        )}
      </button>

      {carregando && (
        <p className="mt-3 text-xs text-slate-500">
          Buscando na base do Google, consultando os detalhes de cada empresa e procurando o
          Instagram nos sites. Isso costuma levar de 10 a 40 segundos.
        </p>
      )}
    </form>
  );
}
