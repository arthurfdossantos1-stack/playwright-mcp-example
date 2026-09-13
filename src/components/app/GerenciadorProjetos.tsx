"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirProjeto, salvarProjeto } from "@/app/app/acoes";
import type { Projeto } from "@/lib/types";

const CORES = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#64748b"];

export type ProjetoComContagem = Projeto & {
  totalBuscas: number;
  totalLeads: number;
};

export function GerenciadorProjetos({ projetos }: { projetos: ProjetoComContagem[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Projeto | "novo" | null>(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setEditando("novo")} className="botao-primario !px-4 !py-2 !text-sm">
          Novo projeto
        </button>
      </div>

      {projetos.length === 0 ? (
        <div className="cartao px-6 py-14 text-center">
          <h2 className="text-base font-bold text-slate-900">Nenhum projeto ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Projetos separam suas varreduras e leads por cliente ou campanha. Útil para quem atende
            mais de uma conta ao mesmo tempo — e liberado para todo mundo.
          </p>
          <button type="button" onClick={() => setEditando("novo")} className="botao-primario mt-6">
            Criar meu primeiro projeto
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projetos.map((projeto) => (
            <li key={projeto.id} className="cartao flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: projeto.cor }}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-bold text-slate-900">{projeto.nome}</h2>
                  {projeto.descricao && (
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">{projeto.descricao}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-slate-600">
                  <strong className="font-bold text-slate-900">{projeto.totalBuscas}</strong>{" "}
                  varredura{projeto.totalBuscas === 1 ? "" : "s"}
                </span>
                <span className="text-slate-600">
                  <strong className="font-bold text-slate-900">{projeto.totalLeads}</strong> lead
                  {projeto.totalLeads === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
                <Link
                  href={`/app/leads?projeto=${projeto.id}`}
                  className="font-semibold text-marca-700 hover:underline"
                >
                  Ver leads
                </Link>
                <Link
                  href={`/app/buscar?projeto=${projeto.id}`}
                  className="font-semibold text-marca-700 hover:underline"
                >
                  Nova varredura
                </Link>
                <button
                  type="button"
                  onClick={() => setEditando(projeto)}
                  className="font-medium text-slate-500 hover:text-slate-800"
                >
                  Editar
                </button>
                <BotaoExcluirProjeto id={projeto.id} aoExcluir={() => router.refresh()} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <EditorProjeto
          projeto={editando === "novo" ? null : editando}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function BotaoExcluirProjeto({ id, aoExcluir }: { id: string; aoExcluir: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="font-medium text-slate-500 hover:text-rose-600"
      >
        Excluir
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="text-slate-500">Confirma?</span>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            await excluirProjeto(id);
            aoExcluir();
          })
        }
        className="font-semibold text-rose-600 hover:underline"
      >
        Sim
      </button>
      <button type="button" onClick={() => setConfirmando(false)} className="font-medium text-slate-500">
        Não
      </button>
    </span>
  );
}

function EditorProjeto({
  projeto,
  aoFechar,
  aoSalvar,
}: {
  projeto: Projeto | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(projeto?.nome ?? "");
  const [descricao, setDescricao] = useState(projeto?.descricao ?? "");
  const [cor, setCor] = useState(projeto?.cor ?? CORES[0]);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    iniciar(async () => {
      const dados = new FormData();
      if (projeto) dados.set("id", projeto.id);
      dados.set("nome", nome);
      dados.set("descricao", descricao);
      dados.set("cor", cor);

      const resposta = await salvarProjeto(dados);
      if (resposta.ok) aoSalvar();
      else setErro(resposta.erro ?? "Não foi possível salvar.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-900/40" onClick={aoFechar} aria-label="Fechar" />
      <form
        onSubmit={enviar}
        className="relative w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">
          {projeto ? "Editar projeto" : "Novo projeto"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="rotulo" htmlFor="projeto-nome">
              Nome
            </label>
            <input
              id="projeto-nome"
              className="campo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Clínicas — Campinas"
            />
          </div>

          <div>
            <label className="rotulo" htmlFor="projeto-descricao">
              Descrição (opcional)
            </label>
            <input
              id="projeto-descricao"
              className="campo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Prospecção para o cliente X"
            />
          </div>

          <div>
            <span className="rotulo">Cor</span>
            <div className="flex flex-wrap gap-2">
              {CORES.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  onClick={() => setCor(opcao)}
                  className={`h-8 w-8 rounded-full transition ${
                    cor === opcao ? "ring-2 ring-slate-900 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: opcao }}
                  aria-label={`Cor ${opcao}`}
                />
              ))}
            </div>
          </div>
        </div>

        {erro && (
          <p className="mt-4 rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700" role="alert">
            {erro}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={aoFechar} className="botao-secundario !px-4 !py-2 !text-sm">
            Cancelar
          </button>
          <button type="submit" disabled={pendente} className="botao-primario !px-4 !py-2 !text-sm">
            {pendente ? "Salvando…" : "Salvar projeto"}
          </button>
        </div>
      </form>
    </div>
  );
}
