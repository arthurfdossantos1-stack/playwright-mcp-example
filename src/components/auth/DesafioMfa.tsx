"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { Logo } from "@/components/marketing/Logo";

/**
 * Segunda etapa do login: o código de 6 dígitos do aplicativo autenticador.
 *
 * Quem manda a pessoa para cá é o layout do /app, que barra sessão de nível
 * aal1 quando a conta tem um fator ativo — então não dá para pular esta tela
 * digitando a URL do app.
 */
export function DesafioMfa() {
  const router = useRouter();
  const parametros = useSearchParams();
  const supabase = useMemo(() => criarClienteSupabase(), []);
  const proximo = parametros.get("proximo") ?? "/app";

  const [fatorId, setFatorId] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [preparando, setPreparando] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setErro("Não foi possível carregar sua verificação em duas etapas.");
      } else {
        const ativo = data.totp.find((f) => f.status === "verified") ?? data.totp[0];
        if (ativo) setFatorId(ativo.id);
        else router.replace(proximo);
      }
      setPreparando(false);
    })();
  }, [supabase, router, proximo]);

  async function verificar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!fatorId) return;

    setCarregando(true);
    setErro(null);

    const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({
      factorId: fatorId,
    });
    if (erroDesafio || !desafio) {
      setErro("Não foi possível iniciar a verificação. Tente de novo.");
      setCarregando(false);
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: fatorId,
      challengeId: desafio.id,
      code: codigo.replace(/\D/g, ""),
    });

    setCarregando(false);

    if (error) {
      setErro("Código inválido ou expirado. Confira o app e tente de novo.");
      setCodigo("");
      return;
    }

    router.push(proximo);
    router.refresh();
  }

  async function sair() {
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <div className="cartao p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Verificação em 2 etapas</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Abra seu aplicativo autenticador e digite o código de 6 dígitos que aparece para o
          RastroLead.
        </p>

        <form onSubmit={verificar} className="mt-6">
          <label className="rotulo" htmlFor="codigo">
            Código de 6 dígitos
          </label>
          <input
            id="codigo"
            className="campo text-center text-2xl font-bold tracking-[0.4em] tabular-nums"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            autoFocus
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
            disabled={preparando || carregando}
            placeholder="000000"
          />

          {erro && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || preparando || codigo.length !== 6}
            className="botao-primario mt-5 w-full"
          >
            {carregando ? "Conferindo…" : "Confirmar e entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={sair}
          className="mt-4 w-full text-center text-sm font-medium text-slate-500 hover:underline"
        >
          Entrar com outra conta
        </button>

        <p className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
          Perdeu o acesso ao aplicativo? Cadastre a chave secreta que você guardou na ativação em
          outro autenticador — ela gera os mesmos códigos.
        </p>
      </div>
    </div>
  );
}
