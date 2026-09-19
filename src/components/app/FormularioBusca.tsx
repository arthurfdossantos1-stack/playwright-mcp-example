"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Projeto } from "@/lib/types";
import { PAISES, PAIS_PADRAO, acharPais } from "@/lib/paises";
import type { FonteBusca } from "@/lib/types";
import { CHAVE_AVISOS } from "./AvisosDaBusca";

const FONTES: { id: FonteBusca; rotulo: string; explica: string }[] = [
  { id: "google", rotulo: "Google", explica: "Empresas no Google Maps: telefone, endereço e avaliações." },
  { id: "instagram", rotulo: "Instagram", explica: "Perfis do nicho na cidade. Acha negócio que existe só no Instagram." },
  { id: "ambos", rotulo: "Os dois", explica: "Junta as duas fontes numa lista só, marcando de onde veio cada lead." },
];

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
  const [fonte, setFonte] = useState<FonteBusca>("google");
  const [noPaisTodo, setNoPaisTodo] = useState(false);
  const [alvo, setAlvo] = useState(60);
  const [somenteSemSite, setSomenteSemSite] = useState(false);
  const [projetoId, setProjetoId] = useState(projetoPadrao ?? "");
  const [carregando, setCarregando] = useState(false);
  const sugestoes = acharPais(pais).sugestoes;
  const nomePais = acharPais(pais).nome;
  const paisComArtigo = acharPais(pais).comArtigo;
  const [erro, setErro] = useState<string | null>(null);

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setCarregando(true);

    try {
      const resposta = await fetch("/api/buscas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicho,
          cidade,
          pais,
          fonte,
          abrangencia: noPaisTodo ? "pais" : "cidade",
          alvo,
          somenteSemSite,
          projetoId: projetoId || null,
        }),
      });

      const dados = (await resposta.json()) as {
        buscaId?: string;
        erro?: string;
        avisos?: string[];
      };

      if (!resposta.ok) {
        setErro(dados.erro ?? "Não foi possível concluir a varredura.");
        setCarregando(false);
        return;
      }

      // Aviso nao e erro: a varredura concluiu, algo so nao rodou por inteiro
      // (tipicamente a cota do Instagram). Fica guardado pra tela de resultado.
      if (dados.avisos?.length) {
        try {
          sessionStorage.setItem(CHAVE_AVISOS, JSON.stringify(dados.avisos));
        } catch {
          /* sem storage o aviso so se perde */
        }
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
      <div className="mb-5">
        <span className="rotulo">Onde buscar</span>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-slate-100 p-1">
          {FONTES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFonte(item.id)}
              aria-pressed={fonte === item.id}
              disabled={carregando}
              className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                fonte === item.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {item.rotulo}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          {FONTES.find((f) => f.id === fonte)?.explica}
        </p>
      </div>

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
          {fonte === "instagram"
            ? "Define a regra de celular usada na fila de WhatsApp."
            : "Define o idioma dos resultados e a regra de celular usada na fila de WhatsApp."}
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
            required={!noPaisTodo}
            minLength={2}
            value={noPaisTodo ? "" : cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder={noPaisTodo ? `${nomePais} inteiro` : acharPais(pais).exemploCidade}
            disabled={carregando || noPaisTodo}
          />
        </div>
      </div>

      {/* Abrangência, quantidade e recorte: o que transforma "uma cidade" em
          "40 imobiliárias sem site no Brasil inteiro". */}
      <div className="mt-4 rounded-xl border border-slate-200 p-3.5">
        <label className="flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={noPaisTodo}
            onChange={(e) => setNoPaisTodo(e.target.checked)}
            disabled={carregando}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-slate-900">
              Buscar no país inteiro
            </span>
            <span className="block text-xs leading-relaxed text-slate-500">
              Varre as maiores praças {paisComArtigo} e junta, sem repetir. O Google corta em
              ~60 por cidade, então é assim que dá para cobrir o país.
            </span>
          </span>
        </label>

        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="alvo">
              Quantas empresas
            </label>
            <select
              id="alvo"
              className="campo !py-2 !text-sm"
              value={alvo}
              onChange={(e) => setAlvo(Number(e.target.value))}
              disabled={carregando}
            >
              {[20, 40, 60, 100].map((n) => (
                <option key={n} value={n}>
                  {n} empresas
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 sm:mt-6">
            <input
              type="checkbox"
              checked={somenteSemSite}
              onChange={(e) => setSomenteSemSite(e.target.checked)}
              disabled={carregando}
              className="h-4 w-4 shrink-0 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
            />
            <span className="text-sm font-medium text-slate-700">Só quem não tem site</span>
          </label>
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
