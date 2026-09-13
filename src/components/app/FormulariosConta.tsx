"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarPerfil, trocarSenha } from "@/app/app/acoes";
import { criarClienteSupabase } from "@/lib/supabase/client";

export function FormularioPerfil({ nomeInicial }: { nomeInicial: string }) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setMensagem(null);
    iniciar(async () => {
      const dados = new FormData();
      dados.set("nome", nome);
      const resposta = await atualizarPerfil(dados);
      setMensagem(resposta.ok ? "Nome atualizado." : (resposta.erro ?? "Erro ao salvar."));
      if (resposta.ok) router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="cartao p-6">
      <h2 className="text-sm font-bold text-slate-900">Dados da conta</h2>
      <p className="mt-1 text-sm text-slate-600">
        Seu nome aparece na variável <code className="rounded bg-slate-100 px-1">{"{{meu_nome}}"}</code>{" "}
        dos templates.
      </p>

      <div className="mt-4 max-w-sm">
        <label className="rotulo" htmlFor="perfil-nome">
          Nome
        </label>
        <input
          id="perfil-nome"
          className="campo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como você assina suas mensagens"
        />
      </div>

      {mensagem && <p className="mt-3 text-sm text-slate-600">{mensagem}</p>}

      <button type="submit" disabled={pendente} className="botao-primario mt-5 !px-4 !py-2 !text-sm">
        {pendente ? "Salvando…" : "Salvar"}
      </button>
    </form>
  );
}

export function FormularioSenha() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setMensagem(null);
    iniciar(async () => {
      const dados = new FormData();
      dados.set("senha", senha);
      dados.set("confirmacao", confirmacao);
      const resposta = await trocarSenha(dados);
      setMensagem(resposta.ok ? "Senha atualizada." : (resposta.erro ?? "Erro ao trocar a senha."));
      if (resposta.ok) {
        setSenha("");
        setConfirmacao("");
      }
    });
  }

  return (
    <form onSubmit={enviar} className="cartao p-6">
      <h2 className="text-sm font-bold text-slate-900">Trocar senha</h2>
      <p className="mt-1 text-sm text-slate-600">
        Defina uma nova senha de acesso. Se você entra com o Google, pode criar uma senha aqui para
        também acessar por e-mail.
      </p>

      <div className="mt-4 grid max-w-lg gap-4 sm:grid-cols-2">
        <div>
          <label className="rotulo" htmlFor="conta-senha">
            Nova senha
          </label>
          <input
            id="conta-senha"
            type="password"
            minLength={6}
            required
            className="campo"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="rotulo" htmlFor="conta-confirmacao">
            Confirmar
          </label>
          <input
            id="conta-confirmacao"
            type="password"
            minLength={6}
            required
            className="campo"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>

      {mensagem && <p className="mt-3 text-sm text-slate-600">{mensagem}</p>}

      <button type="submit" disabled={pendente} className="botao-primario mt-5 !px-4 !py-2 !text-sm">
        {pendente ? "Salvando…" : "Trocar senha"}
      </button>
    </form>
  );
}

export function ConexaoGoogle({ conectado }: { conectado: boolean }) {
  const [pendente, setPendente] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function conectar() {
    setPendente(true);
    setErro(null);
    const supabase = criarClienteSupabase();
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?proximo=/app/configuracoes` },
    });
    if (error) {
      setErro(error.message);
      setPendente(false);
    }
  }

  return (
    <div className="cartao p-6">
      <h2 className="text-sm font-bold text-slate-900">Conta Google</h2>
      <p className="mt-1 text-sm text-slate-600">
        {conectado
          ? "Sua conta Google está conectada. Você pode entrar com um clique."
          : "Conecte sua conta Google para entrar sem digitar senha."}
      </p>

      {erro && <p className="mt-3 text-sm text-rose-700">{erro}</p>}

      {!conectado && (
        <button type="button" onClick={conectar} disabled={pendente} className="botao-secundario mt-4 !px-4 !py-2 !text-sm">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z" />
            <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
            <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z" />
          </svg>
          {pendente ? "Abrindo…" : "Conectar Google"}
        </button>
      )}

      {conectado && (
        <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Conectado
        </span>
      )}
    </div>
  );
}
