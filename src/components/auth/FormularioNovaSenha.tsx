"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { Logo } from "@/components/marketing/Logo";

export function FormularioNovaSenha() {
  const router = useRouter();
  const supabase = useMemo(() => criarClienteSupabase(), []);

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha !== confirmacao) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro(
        error.message.includes("session")
          ? "O link expirou. Peça um novo link de redefinição."
          : error.message,
      );
      return;
    }

    setOk(true);
    setTimeout(() => {
      router.push("/app");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <div className="cartao p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Definir nova senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Escolha uma senha nova para sua conta. Depois disso você já entra direto no app.
        </p>

        <form onSubmit={aoEnviar} className="mt-6 space-y-4">
          <div>
            <label className="rotulo" htmlFor="nova-senha">
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              required
              minLength={6}
              className="campo"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="rotulo" htmlFor="confirmar-senha">
              Confirme a nova senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              required
              minLength={6}
              className="campo"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {erro && (
            <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
              {erro}
            </p>
          )}
          {ok && (
            <p className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
              Senha atualizada! Levando você para o app…
            </p>
          )}

          <button type="submit" disabled={carregando || ok} className="botao-primario w-full">
            {carregando ? "Salvando…" : "Salvar nova senha"}
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <Link href="/auth" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Voltar para o login
        </Link>
      </div>
    </div>
  );
}
