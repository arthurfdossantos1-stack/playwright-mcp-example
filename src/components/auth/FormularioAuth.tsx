"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";
import { Logo } from "@/components/marketing/Logo";
import { avaliarForcaSenha } from "@/lib/senha";

type Modo = "login" | "cadastro" | "recuperar";

const TITULOS: Record<Modo, { titulo: string; subtitulo: string }> = {
  login: {
    titulo: "Entrar no RastroLead",
    subtitulo: "Bem-vindo de volta. Sua próxima varredura está a um clique.",
  },
  cadastro: {
    titulo: "Criar sua conta gratuita",
    subtitulo: "Acesso completo e ilimitado assim que a conta for criada. Sem cartão, sem plano.",
  },
  recuperar: {
    titulo: "Redefinir senha",
    subtitulo: "Informe seu e-mail e enviaremos um link para você criar uma nova senha.",
  },
};

export function FormularioAuth() {
  const router = useRouter();
  const parametros = useSearchParams();
  const supabase = useMemo(() => criarClienteSupabase(), []);

  const modoInicial = (parametros.get("modo") as Modo | null) ?? "login";
  const proximo = parametros.get("proximo") ?? "/app";

  const [modo, setModo] = useState<Modo>(
    modoInicial === "cadastro" || modoInicial === "recuperar" ? modoInicial : "login",
  );
  const [email, setEmail] = useState("");
  const [confirmacaoEmail, setConfirmacaoEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [nome, setNome] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const forca = avaliarForcaSenha(senha);
  const emailsDivergem =
    modo === "cadastro" && confirmacaoEmail.length > 0 && email.trim() !== confirmacaoEmail.trim();
  const senhasDivergem =
    modo === "cadastro" && confirmacaoSenha.length > 0 && senha !== confirmacaoSenha;

  function trocarModo(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
    setConfirmacaoEmail("");
    setConfirmacaoSenha("");
  }

  async function aoEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    setCarregando(true);
    setErro(null);
    setAviso(null);

    try {
      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?proximo=/auth/atualizar-senha`,
        });
        if (error) throw error;
        setAviso("Enviamos um link de redefinição para o seu e-mail. Confira a caixa de entrada.");
        return;
      }

      if (modo === "cadastro") {
        if (email.trim() !== confirmacaoEmail.trim()) {
          setErro("Os e-mails não conferem. Confira os dois campos.");
          return;
        }
        if (senha !== confirmacaoSenha) {
          setErro("As senhas não conferem.");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: { full_name: nome || null },
            // Leva pra uma pagina de confirmacao que NAO exige sessao. O link do
            // e-mail costuma abrir no navegador interno do app de e-mail, onde a
            // sessao criada nao serve pro navegador de verdade do usuario.
            emailRedirectTo: `${window.location.origin}/auth/callback?proximo=/auth/confirmado`,
          },
        });
        if (error) throw error;

        // Sem confirmacao de e-mail o Supabase ja devolve sessao: acesso liberado na hora.
        if (data.session) {
          router.push(proximo);
          router.refresh();
          return;
        }

        setAviso(
          "Conta criada! Confirme seu e-mail pelo link que acabamos de enviar para liberar o acesso.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      router.push(proximo);
      router.refresh();
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComGoogle() {
    setCarregando(true);
    setErro(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?proximo=${encodeURIComponent(proximo)}`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setErro(traduzirErro(e));
      setCarregando(false);
    }
  }

  const { titulo, subtitulo } = TITULOS[modo];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>

      <div className="cartao p-7 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{titulo}</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{subtitulo}</p>

        {modo !== "recuperar" && (
          <>
            <button
              type="button"
              onClick={entrarComGoogle}
              disabled={carregando}
              className="botao-secundario mt-6 w-full"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
                />
              </svg>
              Continuar com Google
            </button>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">ou</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>
          </>
        )}

        <form onSubmit={aoEnviar} className="space-y-4">
          {modo === "cadastro" && (
            <div>
              <label className="rotulo" htmlFor="nome">
                Seu nome
              </label>
              <input
                id="nome"
                className="campo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Como podemos te chamar"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="rotulo" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              className="campo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              autoComplete="email"
            />
          </div>

          {modo === "cadastro" && (
            <div>
              <label className="rotulo" htmlFor="confirmar-email">
                Confirme o e-mail
              </label>
              <input
                id="confirmar-email"
                type="email"
                required
                className="campo"
                value={confirmacaoEmail}
                onChange={(e) => setConfirmacaoEmail(e.target.value)}
                placeholder="digite o mesmo e-mail"
                autoComplete="off"
                onPaste={(e) => e.preventDefault()}
                aria-invalid={emailsDivergem}
              />
              {emailsDivergem && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">
                  Os e-mails não conferem.
                </p>
              )}
            </div>
          )}

          {modo !== "recuperar" && (
            <div>
              <div className="flex items-center justify-between">
                <label className="rotulo" htmlFor="senha">
                  Senha
                </label>
                {modo === "login" && (
                  <button
                    type="button"
                    onClick={() => trocarModo("recuperar")}
                    className="mb-1.5 text-xs font-semibold text-marca-700 hover:underline"
                  >
                    Redefinir senha
                  </button>
                )}
              </div>
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                className="campo"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={modo === "cadastro" ? "Pelo menos 8 caracteres" : "Sua senha"}
                autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
              />

              {modo === "cadastro" && senha.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <span
                          key={i}
                          className={`h-full flex-1 rounded-full transition-colors ${
                            i < forca.score ? forca.cor : "bg-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="w-20 shrink-0 text-right text-[11px] font-semibold text-slate-600">
                      {forca.rotulo}
                    </span>
                  </div>
                  <p className="sr-only" role="status">
                    Força da senha: {forca.rotulo}
                  </p>
                  {forca.sugestoes.length > 0 && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Para reforçar: {forca.sugestoes.join(", ")}.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {modo === "cadastro" && (
            <div>
              <label className="rotulo" htmlFor="confirmar-senha">
                Confirme a senha
              </label>
              <input
                id="confirmar-senha"
                type="password"
                required
                minLength={6}
                className="campo"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
                placeholder="digite a mesma senha"
                autoComplete="new-password"
                aria-invalid={senhasDivergem}
              />
              {senhasDivergem && (
                <p className="mt-1.5 text-xs font-medium text-rose-600">As senhas não conferem.</p>
              )}
            </div>
          )}

          {erro && (
            <p className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
              {erro}
            </p>
          )}
          {aviso && (
            <p className="rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando || emailsDivergem || senhasDivergem}
            className="botao-primario w-full"
          >
            {carregando
              ? "Aguarde…"
              : modo === "cadastro"
                ? "Criar conta e entrar"
                : modo === "recuperar"
                  ? "Enviar link de redefinição"
                  : "Entrar"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {modo === "login" && (
            <>
              Ainda não tem conta?{" "}
              <button
                type="button"
                onClick={() => trocarModo("cadastro")}
                className="font-semibold text-marca-700 hover:underline"
              >
                Criar conta
              </button>
            </>
          )}
          {modo === "cadastro" && (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => trocarModo("login")}
                className="font-semibold text-marca-700 hover:underline"
              >
                Entrar
              </button>
            </>
          )}
          {modo === "recuperar" && (
            <button
              type="button"
              onClick={() => trocarModo("login")}
              className="font-semibold text-marca-700 hover:underline"
            >
              Voltar para o login
            </button>
          )}
        </div>
      </div>

      {modo === "cadastro" && (
        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
          Ao criar a conta você concorda com os{" "}
          <Link href="/termos" className="underline hover:text-slate-700">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="underline hover:text-slate-700">
            Política de privacidade
          </Link>
          .
        </p>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-800">
          ← Voltar para o início
        </Link>
      </div>
    </div>
  );
}

function traduzirErro(erro: unknown): string {
  const mensagem = erro instanceof Error ? erro.message : String(erro);
  const mapa: Record<string, string> = {
    "Invalid login credentials": "E-mail ou senha incorretos.",
    "User already registered": "Este e-mail já tem conta. Tente entrar ou redefinir a senha.",
    "Email not confirmed": "Confirme seu e-mail pelo link que enviamos antes de entrar.",
    "Password should be at least 6 characters.": "A senha precisa ter pelo menos 6 caracteres.",
    "Unable to validate email address: invalid format": "E-mail em formato inválido.",
    "For security purposes, you can only request this after 60 seconds.":
      "Aguarde um minuto antes de tentar novamente.",
  };

  for (const [chave, traducao] of Object.entries(mapa)) {
    if (mensagem.includes(chave)) return traducao;
  }

  if (mensagem.toLowerCase().includes("fetch")) {
    return "Não conseguimos falar com o servidor. Verifique sua conexão e as chaves do Supabase.";
  }

  return mensagem || "Não foi possível concluir. Tente novamente.";
}
