"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { criarClienteSupabase } from "@/lib/supabase/client";

type Fator = { id: string; status: string; friendly_name?: string };
type Inscricao = { id: string; qr: string; segredo: string };

/**
 * Verificação em duas etapas por aplicativo autenticador (TOTP).
 *
 * Por que app e não código por e-mail: o serviço de e-mail embutido do
 * Supabase entrega "best-effort" e já falha com os links de confirmação —
 * amarrar o LOGIN a ele seria trocar segurança por risco de ficar trancado
 * para fora da própria conta. O código do app funciona offline e é validado
 * pelo servidor do Supabase.
 */
export function Autenticacao2Etapas() {
  const supabase = useMemo(() => criarClienteSupabase(), []);

  const [fatores, setFatores] = useState<Fator[]>([]);
  const [inscricao, setInscricao] = useState<Inscricao | null>(null);
  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFatores((data?.totp ?? []) as Fator[]);
  }, [supabase]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const ativo = fatores.find((f) => f.status === "verified") ?? null;

  async function comecar() {
    setCarregando(true);
    setErro(null);
    setAviso(null);

    // Sobra de tentativa anterior impede um novo enroll: limpa antes.
    for (const pendente of fatores.filter((f) => f.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: pendente.id });
    }

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `RastroLead ${new Date().toLocaleDateString("pt-BR")}`,
    });
    setCarregando(false);

    if (error || !data) {
      setErro(error?.message ?? "Não foi possível iniciar a ativação.");
      return;
    }
    setInscricao({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret });
  }

  async function confirmar(evento: React.FormEvent) {
    evento.preventDefault();
    if (!inscricao) return;

    setCarregando(true);
    setErro(null);

    const { data: desafio, error: erroDesafio } = await supabase.auth.mfa.challenge({
      factorId: inscricao.id,
    });
    if (erroDesafio || !desafio) {
      setCarregando(false);
      setErro("Não foi possível confirmar agora. Tente de novo.");
      return;
    }

    const { error } = await supabase.auth.mfa.verify({
      factorId: inscricao.id,
      challengeId: desafio.id,
      code: codigo.replace(/\D/g, ""),
    });
    setCarregando(false);

    if (error) {
      setErro("Código inválido. Confira o app — ele troca a cada 30 segundos.");
      setCodigo("");
      return;
    }

    setInscricao(null);
    setCodigo("");
    setAviso("Verificação em duas etapas ativada. A partir do próximo login pediremos o código.");
    await recarregar();
  }

  async function desativar() {
    if (!ativo) return;
    setCarregando(true);
    setErro(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId: ativo.id });
    setCarregando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setAviso("Verificação em duas etapas desativada.");
    await recarregar();
  }

  return (
    <div className="cartao p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">Verificação em duas etapas</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Além da senha, o login passa a pedir um código de 6 dígitos do seu aplicativo
            autenticador (Google Authenticator, Authy, 1Password e afins).
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
            ativo
              ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
              : "bg-slate-100 text-slate-600 ring-slate-200"
          }`}
        >
          {ativo ? "Ativa" : "Desativada"}
        </span>
      </div>

      {aviso && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700" role="status">
          {aviso}
        </p>
      )}
      {erro && (
        <p className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
          {erro}
        </p>
      )}

      {inscricao ? (
        <div className="mt-5">
          <ol className="space-y-3 text-sm text-slate-600">
            <li>
              <strong className="font-semibold text-slate-900">1.</strong> Abra seu aplicativo
              autenticador e escaneie o código abaixo.
            </li>
          </ol>

          <div className="mt-3 flex justify-center rounded-xl border border-slate-200 bg-white p-4">
            {/* O Supabase devolve o QR como SVG em data URL: nada sai daqui. */}
            <Image src={inscricao.qr} alt="QR code da verificação em duas etapas" width={180} height={180} unoptimized />
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Não consegue escanear? Digite esta chave no app:
          </p>
          <code className="mt-1.5 block break-all rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
            {inscricao.segredo}
          </code>
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
            <strong className="font-semibold">Guarde essa chave em lugar seguro.</strong> Ela é o
            seu backup: se perder o celular, é com ela que você recadastra os códigos em outro
            aplicativo. Sem ela e sem o celular, não há como entrar.
          </p>

          <form onSubmit={confirmar} className="mt-5">
            <label className="rotulo" htmlFor="codigo-2fa">
              2. Digite o código que o app mostra
            </label>
            <input
              id="codigo-2fa"
              className="campo text-center text-xl font-bold tracking-[0.35em] tabular-nums"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="submit" disabled={carregando || codigo.length !== 6} className="botao-primario !py-2 !text-sm">
                {carregando ? "Conferindo…" : "Ativar"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setInscricao(null);
                  setCodigo("");
                }}
                className="botao-secundario !py-2 !text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {ativo ? (
            <button type="button" onClick={desativar} disabled={carregando} className="botao-secundario !py-2 !text-sm">
              {carregando ? "…" : "Desativar"}
            </button>
          ) : (
            <button type="button" onClick={comecar} disabled={carregando} className="botao-primario !py-2 !text-sm">
              {carregando ? "…" : "Ativar verificação em duas etapas"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
