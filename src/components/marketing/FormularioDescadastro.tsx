"use client";

import { useState } from "react";
import { PAISES, PAIS_PADRAO } from "@/lib/paises";

export function FormularioDescadastro() {
  const [telefone, setTelefone] = useState("");
  const [pais, setPais] = useState(PAIS_PADRAO);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const r = await fetch("/api/nao-quero-receber", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefone, pais }),
      });
      const dados = (await r.json()) as { erro?: string; numero?: string };
      if (!r.ok) {
        setErro(dados.erro ?? "Não consegui registrar agora.");
        return;
      }
      setPronto(dados.numero ?? telefone);
    } catch {
      setErro("Falha de conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="cartao p-6" role="status">
        <h2 className="text-base font-bold text-slate-900">Pronto. Número removido.</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          O número terminado em <strong>{pronto}</strong> entrou na nossa lista de não perturbe.
        </p>
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-slate-600">
          <li>Ele saiu agora de qualquer envio que ainda não tinha acontecido.</li>
          <li>Novas buscas não vão trazê-lo de volta.</li>
          <li>O bloqueio vale para todos os usuários da plataforma, não só para quem te procurou.</li>
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Guardamos apenas o número, para conseguir reconhecê-lo e manter a recusa. É o mínimo
          necessário para cumprir o seu pedido.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="cartao space-y-4 p-6">
      <div>
        <label className="rotulo" htmlFor="pais-descadastro">
          País
        </label>
        <select
          id="pais-descadastro"
          className="campo"
          value={pais}
          onChange={(e) => setPais(e.target.value)}
        >
          {PAISES.map((p) => (
            <option key={p.codigo} value={p.codigo}>
              {p.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="rotulo" htmlFor="telefone-descadastro">
          Seu número de WhatsApp
        </label>
        <input
          id="telefone-descadastro"
          className="campo"
          type="tel"
          required
          placeholder="(11) 98765-4321"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
          Com DDD. Pode digitar do jeito que preferir — com parênteses, traços ou só os números.
        </p>
      </div>

      {erro && (
        <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" disabled={enviando} className="botao-primario w-full">
        {enviando ? "Registrando…" : "Não quero mais receber"}
      </button>
    </form>
  );
}
