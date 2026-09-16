"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirTemplate, salvarTemplate } from "@/app/app/acoes";
import {
  VARIAVEIS_TEMPLATE,
  aplicarVariaveis,
  variaveisDesconhecidas,
} from "@/lib/templates";
import { CANAL_LABEL, type CanalContato, type Template } from "@/lib/types";

const EXEMPLO = Object.fromEntries(VARIAVEIS_TEMPLATE.map((v) => [v.chave, v.exemplo]));

export function GerenciadorTemplates({ templates }: { templates: Template[] }) {
  const router = useRouter();
  const [editando, setEditando] = useState<Template | "novo" | null>(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setEditando("novo")} className="botao-primario !px-4 !py-2 !text-sm">
          Novo template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="cartao px-6 py-14 text-center">
          <h2 className="text-base font-bold text-slate-900">Nenhum template ainda</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Crie mensagens reutilizáveis com variáveis como <code>{"{{empresa}}"}</code> e{" "}
            <code>{"{{cidade}}"}</code>. Elas são preenchidas com os dados reais de cada lead.
          </p>
          <button type="button" onClick={() => setEditando("novo")} className="botao-primario mt-6">
            Criar meu primeiro template
          </button>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <li key={template.id} className="cartao flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{template.nome}</h2>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {CANAL_LABEL[template.canal]}
                  </span>
                </div>
              </div>

              {template.assunto && (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  Assunto: <span className="font-normal">{template.assunto}</span>
                </p>
              )}

              <pre className="mt-3 flex-1 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
                {template.corpo}
              </pre>

              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditando(template)}
                  className="text-xs font-semibold text-marca-700 hover:underline"
                >
                  Editar
                </button>
                <BotaoExcluir id={template.id} aoExcluir={() => router.refresh()} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <EditorTemplate
          template={editando === "novo" ? null : editando}
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

function BotaoExcluir({ id, aoExcluir }: { id: string; aoExcluir: () => void }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pendente, iniciar] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-xs font-medium text-slate-500 hover:text-rose-600"
      >
        Excluir
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs">
      <span className="text-slate-500">Confirma?</span>
      <button
        type="button"
        disabled={pendente}
        onClick={() =>
          iniciar(async () => {
            await excluirTemplate(id);
            aoExcluir();
          })
        }
        className="font-semibold text-rose-600 hover:underline"
      >
        Sim
      </button>
      <button
        type="button"
        onClick={() => setConfirmando(false)}
        className="font-medium text-slate-500 hover:underline"
      >
        Não
      </button>
    </span>
  );
}

function EditorTemplate({
  template,
  aoFechar,
  aoSalvar,
}: {
  template: Template | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(template?.nome ?? "");
  const [canal, setCanal] = useState<CanalContato>(template?.canal ?? "whatsapp");
  const [assunto, setAssunto] = useState(template?.assunto ?? "");
  const [corpo, setCorpo] = useState(template?.corpo ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const desconhecidas = variaveisDesconhecidas(corpo);
  const previa = aplicarVariaveis(corpo, EXEMPLO);

  function inserirVariavel(chave: string) {
    setCorpo((atual) => `${atual}{{${chave}}}`);
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    iniciar(async () => {
      const dados = new FormData();
      if (template) dados.set("id", template.id);
      dados.set("nome", nome);
      dados.set("canal", canal);
      dados.set("assunto", assunto);
      dados.set("corpo", corpo);

      const resposta = await salvarTemplate(dados);
      if (resposta.ok) aoSalvar();
      else setErro(resposta.erro ?? "Não foi possível salvar.");
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button type="button" className="absolute inset-0 bg-[#020617]/50" onClick={aoFechar} aria-label="Fechar" />
      <form
        onSubmit={enviar}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 className="text-lg font-bold text-slate-900">
          {template ? "Editar template" : "Novo template"}
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="rotulo" htmlFor="template-nome">
              Nome
            </label>
            <input
              id="template-nome"
              className="campo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Primeiro contato — sem site"
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="template-canal">
              Canal
            </label>
            <select
              id="template-canal"
              className="campo"
              value={canal}
              onChange={(e) => setCanal(e.target.value as CanalContato)}
            >
              {(Object.keys(CANAL_LABEL) as CanalContato[]).map((c) => (
                <option key={c} value={c}>
                  {CANAL_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {canal === "email" && (
          <div className="mt-4">
            <label className="rotulo" htmlFor="template-assunto">
              Assunto
            </label>
            <input
              id="template-assunto"
              className="campo"
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Uma ideia rápida para a {{empresa}}"
            />
          </div>
        )}

        <div className="mt-4">
          <label className="rotulo" htmlFor="template-corpo">
            Mensagem
          </label>
          <textarea
            id="template-corpo"
            className="campo min-h-40 font-mono !text-[13px]"
            required
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            placeholder="Olá, {{empresa}}! Encontrei vocês pesquisando {{nicho}} em {{cidade}}…"
          />
        </div>

        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">Clique para inserir:</p>
          <div className="flex flex-wrap gap-1.5">
            {VARIAVEIS_TEMPLATE.map((variavel) => (
              <button
                key={variavel.chave}
                type="button"
                onClick={() => inserirVariavel(variavel.chave)}
                title={variavel.rotulo}
                className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-600 transition hover:bg-marca-100 hover:text-marca-700"
              >
                {`{{${variavel.chave}}}`}
              </button>
            ))}
          </div>
        </div>

        {desconhecidas.length > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            Variável não reconhecida: {desconhecidas.map((v) => `{{${v}}}`).join(", ")}. Ela ficará
            vazia na mensagem enviada.
          </p>
        )}

        {corpo.trim() && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold text-slate-500">Prévia com dados de exemplo</p>
            <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">
              {previa}
            </pre>
          </div>
        )}

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
            {pendente ? "Salvando…" : "Salvar template"}
          </button>
        </div>
      </form>
    </div>
  );
}
