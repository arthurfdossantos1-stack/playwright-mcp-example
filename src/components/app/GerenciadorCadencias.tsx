"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { excluirCadencia, salvarCadencia } from "@/app/app/acoes";
import { rotuloDia } from "@/lib/cadencias";
import { CANAL_LABEL, type CadenciaComEtapas, type CanalContato, type Template } from "@/lib/types";

type EtapaEditor = {
  chave: string;
  dia_offset: number;
  canal: CanalContato;
  template_id: string | null;
  titulo: string | null;
};

function novaChave() {
  return Math.random().toString(36).slice(2, 10);
}

export function GerenciadorCadencias({
  cadencias,
  templates,
}: {
  cadencias: CadenciaComEtapas[];
  templates: Template[];
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<CadenciaComEtapas | "nova" | null>(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button type="button" onClick={() => setEditando("nova")} className="botao-primario !px-4 !py-2 !text-sm">
          Nova cadência
        </button>
      </div>

      {cadencias.length === 0 ? (
        <div className="cartao px-6 py-14 text-center">
          <h2 className="text-base font-bold text-slate-900">Nenhuma cadência configurada</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Uma cadência é a sequência de contatos que você combina antes de começar: dia 0 a
            primeira mensagem, dia 3 o lembrete, dia 7 o último contato.
          </p>
          <button type="button" onClick={() => setEditando("nova")} className="botao-primario mt-6">
            Criar minha primeira cadência
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {cadencias.map((cadencia) => (
            <li key={cadencia.id} className="cartao p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900">{cadencia.nome}</h2>
                    {!cadencia.ativa && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        Pausada
                      </span>
                    )}
                  </div>
                  {cadencia.descricao && (
                    <p className="mt-1 text-sm text-slate-600">{cadencia.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditando(cadencia)}
                    className="text-xs font-semibold text-marca-700 hover:underline"
                  >
                    Editar
                  </button>
                  <BotaoExcluirCadencia id={cadencia.id} aoExcluir={() => router.refresh()} />
                </div>
              </div>

              <ol className="mt-4 space-y-2">
                {[...cadencia.cadencia_etapas]
                  .sort((a, b) => a.dia_offset - b.dia_offset)
                  .map((etapa, indice) => (
                    <li
                      key={etapa.id}
                      className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-marca-600 text-[11px] font-bold text-[#ffffff]">
                        {indice + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {rotuloDia(etapa.dia_offset)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {etapa.titulo ?? "Sem título"} · {CANAL_LABEL[etapa.canal]}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        {templates.find((t) => t.id === etapa.template_id)?.nome ?? "Sem template"}
                      </span>
                    </li>
                  ))}
              </ol>
            </li>
          ))}
        </ul>
      )}

      {editando && (
        <EditorCadencia
          cadencia={editando === "nova" ? null : editando}
          templates={templates}
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

function BotaoExcluirCadencia({ id, aoExcluir }: { id: string; aoExcluir: () => void }) {
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
            await excluirCadencia(id);
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

function EditorCadencia({
  cadencia,
  templates,
  aoFechar,
  aoSalvar,
}: {
  cadencia: CadenciaComEtapas | null;
  templates: Template[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(cadencia?.nome ?? "");
  const [descricao, setDescricao] = useState(cadencia?.descricao ?? "");
  const [ativa, setAtiva] = useState(cadencia?.ativa ?? true);
  const [etapas, setEtapas] = useState<EtapaEditor[]>(
    cadencia && cadencia.cadencia_etapas.length > 0
      ? [...cadencia.cadencia_etapas]
          .sort((a, b) => a.dia_offset - b.dia_offset)
          .map((etapa) => ({
            chave: etapa.id,
            dia_offset: etapa.dia_offset,
            canal: etapa.canal,
            template_id: etapa.template_id,
            titulo: etapa.titulo,
          }))
      : [
          { chave: novaChave(), dia_offset: 0, canal: "whatsapp", template_id: null, titulo: "Primeira mensagem" },
          { chave: novaChave(), dia_offset: 3, canal: "whatsapp", template_id: null, titulo: "Lembrete" },
          { chave: novaChave(), dia_offset: 7, canal: "whatsapp", template_id: null, titulo: "Último contato" },
        ],
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function atualizarEtapa(chave: string, mudanca: Partial<EtapaEditor>) {
    setEtapas((atual) =>
      atual.map((etapa) => (etapa.chave === chave ? { ...etapa, ...mudanca } : etapa)),
    );
  }

  function adicionarEtapa() {
    const ultimoDia = etapas.reduce((maior, e) => Math.max(maior, e.dia_offset), 0);
    setEtapas((atual) => [
      ...atual,
      {
        chave: novaChave(),
        dia_offset: ultimoDia + 3,
        canal: "whatsapp",
        template_id: null,
        titulo: "Nova etapa",
      },
    ]);
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    iniciar(async () => {
      const dados = new FormData();
      if (cadencia) dados.set("id", cadencia.id);
      dados.set("nome", nome);
      dados.set("descricao", descricao);
      dados.set("ativa", String(ativa));
      dados.set(
        "etapas",
        JSON.stringify(
          etapas.map((e) => ({
            dia_offset: Number(e.dia_offset) || 0,
            canal: e.canal,
            template_id: e.template_id,
            titulo: e.titulo,
          })),
        ),
      );

      const resposta = await salvarCadencia(dados);
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
          {cadencia ? "Editar cadência" : "Nova cadência"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className="rotulo" htmlFor="cadencia-nome">
              Nome
            </label>
            <input
              id="cadencia-nome"
              className="campo"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Cadência padrão (0 / 3 / 7)"
            />
          </div>

          <div>
            <label className="rotulo" htmlFor="cadencia-descricao">
              Descrição (opcional)
            </label>
            <input
              id="cadencia-descricao"
              className="campo"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Primeira mensagem, lembrete no dia 3 e último contato no dia 7."
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={ativa}
              onChange={(e) => setAtiva(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-marca-600 focus:ring-marca-500"
            />
            Cadência ativa (disponível para matricular leads)
          </label>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Etapas</h3>
            <button
              type="button"
              onClick={adicionarEtapa}
              className="text-xs font-semibold text-marca-700 hover:underline"
            >
              + Adicionar etapa
            </button>
          </div>

          <ul className="space-y-3">
            {etapas.map((etapa, indice) => (
              <li key={etapa.chave} className="rounded-xl border border-slate-200 p-3.5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Etapa {indice + 1}</span>
                  {etapas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setEtapas((atual) => atual.filter((e) => e.chave !== etapa.chave))}
                      className="text-xs font-medium text-slate-400 hover:text-rose-600"
                    >
                      Remover
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[90px_1fr_1fr]">
                  <div>
                    <label className="rotulo" htmlFor={`dia-${etapa.chave}`}>
                      Dia
                    </label>
                    <input
                      id={`dia-${etapa.chave}`}
                      type="number"
                      min={0}
                      max={365}
                      className="campo"
                      value={etapa.dia_offset}
                      onChange={(e) =>
                        atualizarEtapa(etapa.chave, { dia_offset: Number(e.target.value) })
                      }
                    />
                  </div>

                  <div>
                    <label className="rotulo" htmlFor={`canal-${etapa.chave}`}>
                      Canal
                    </label>
                    <select
                      id={`canal-${etapa.chave}`}
                      className="campo"
                      value={etapa.canal}
                      onChange={(e) =>
                        atualizarEtapa(etapa.chave, { canal: e.target.value as CanalContato })
                      }
                    >
                      {(Object.keys(CANAL_LABEL) as CanalContato[]).map((c) => (
                        <option key={c} value={c}>
                          {CANAL_LABEL[c]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="rotulo" htmlFor={`template-${etapa.chave}`}>
                      Template
                    </label>
                    <select
                      id={`template-${etapa.chave}`}
                      className="campo"
                      value={etapa.template_id ?? ""}
                      onChange={(e) =>
                        atualizarEtapa(etapa.chave, { template_id: e.target.value || null })
                      }
                    >
                      <option value="">Sem template</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="rotulo" htmlFor={`titulo-${etapa.chave}`}>
                    Título da etapa
                  </label>
                  <input
                    id={`titulo-${etapa.chave}`}
                    className="campo"
                    value={etapa.titulo ?? ""}
                    onChange={(e) => atualizarEtapa(etapa.chave, { titulo: e.target.value })}
                    placeholder="Lembrete"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {templates.length === 0 && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            Você ainda não tem templates. A cadência funciona mesmo assim, mas os follow-ups virão
            sem mensagem pronta.
          </p>
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
            {pendente ? "Salvando…" : "Salvar cadência"}
          </button>
        </div>
      </form>
    </div>
  );
}
