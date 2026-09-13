"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { agendarCadencia, type EtapaParaAgendar } from "@/lib/cadencias";
import { aplicarVariaveis, contextoDaEmpresa } from "@/lib/templates";
import type { CanalContato, LeadStatus } from "@/lib/types";

/**
 * Todas as acoes abaixo exigem apenas sessao valida.
 * Nao existe verificacao de plano, cota ou limite de uso.
 */
async function exigirUsuario() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre novamente.");
  return { supabase, user };
}

export type Resposta = { ok: boolean; erro?: string; id?: string };

function falha(erro: unknown): Resposta {
  return { ok: false, erro: erro instanceof Error ? erro.message : "Algo deu errado." };
}

// ---------------------------------------------------------------- PROJETOS

export async function salvarProjeto(formData: FormData): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const id = String(formData.get("id") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim() || null;
    const cor = String(formData.get("cor") ?? "#2563eb");

    if (!nome) return { ok: false, erro: "Dê um nome ao projeto." };

    if (id) {
      const { error } = await supabase
        .from("projetos")
        .update({ nome, descricao, cor })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("projetos")
        .insert({ user_id: user.id, nome, descricao, cor });
      if (error) throw error;
    }

    revalidatePath("/app/projetos");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function excluirProjeto(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("projetos").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app/projetos");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// ------------------------------------------------------------------ BUSCAS

export async function excluirBusca(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("buscas").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function vincularBuscaAoProjeto(
  buscaId: string,
  projetoId: string | null,
): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase
      .from("buscas")
      .update({ projeto_id: projetoId })
      .eq("id", buscaId)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath(`/app/resultados/${buscaId}`);
    revalidatePath("/app/projetos");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// ------------------------------------------------------------------- LEADS

/** Envia uma empresa da varredura para o funil. */
export async function adicionarLead(
  empresaId: string,
  projetoId?: string | null,
): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();

    const { data: empresa, error: erroEmpresa } = await supabase
      .from("empresas")
      .select("id, busca_id")
      .eq("id", empresaId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (erroEmpresa) throw erroEmpresa;
    if (!empresa) return { ok: false, erro: "Empresa não encontrada." };

    let projeto = projetoId ?? null;
    if (!projeto) {
      const { data: busca } = await supabase
        .from("buscas")
        .select("projeto_id")
        .eq("id", empresa.busca_id)
        .maybeSingle();
      projeto = busca?.projeto_id ?? null;
    }

    const { data, error } = await supabase
      .from("leads")
      .upsert(
        { user_id: user.id, empresa_id: empresaId, projeto_id: projeto, status: "novo" },
        { onConflict: "user_id,empresa_id", ignoreDuplicates: true },
      )
      .select("id")
      .maybeSingle();
    if (error) throw error;

    // Empresa ja estava no funil: o upsert nao devolve linha, entao buscamos o id.
    let leadId = data?.id as string | undefined;
    if (!leadId) {
      const { data: existente } = await supabase
        .from("leads")
        .select("id")
        .eq("user_id", user.id)
        .eq("empresa_id", empresaId)
        .maybeSingle();
      leadId = existente?.id;
    }

    revalidatePath("/app/leads");
    revalidatePath("/app/radar");
    revalidatePath(`/app/resultados/${empresa.busca_id}`);
    return { ok: true, id: leadId };
  } catch (e) {
    return falha(e);
  }
}

export async function adicionarLeadsEmLote(empresaIds: string[]): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    if (empresaIds.length === 0) return { ok: false, erro: "Selecione ao menos uma empresa." };

    const { data: empresas, error: erroEmpresas } = await supabase
      .from("empresas")
      .select("id, busca_id")
      .in("id", empresaIds)
      .eq("user_id", user.id);
    if (erroEmpresas) throw erroEmpresas;

    const buscas = [...new Set((empresas ?? []).map((e) => e.busca_id))];
    const { data: dadosBuscas } = await supabase
      .from("buscas")
      .select("id, projeto_id")
      .in("id", buscas.length ? buscas : ["00000000-0000-0000-0000-000000000000"]);

    const projetoPorBusca = new Map(
      (dadosBuscas ?? []).map((b) => [b.id, b.projeto_id as string | null]),
    );

    const linhas = (empresas ?? []).map((e) => ({
      user_id: user.id,
      empresa_id: e.id,
      projeto_id: projetoPorBusca.get(e.busca_id) ?? null,
      status: "novo" as const,
    }));

    const { error } = await supabase
      .from("leads")
      .upsert(linhas, { onConflict: "user_id,empresa_id", ignoreDuplicates: true });
    if (error) throw error;

    revalidatePath("/app/leads");
    revalidatePath("/app/radar");
    for (const busca of buscas) revalidatePath(`/app/resultados/${busca}`);
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function moverLead(
  leadId: string,
  status: LeadStatus,
  posicao = 0,
): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const atualizacao: Record<string, unknown> = { status, posicao };
    if (status === "contatado") atualizacao.ultimo_contato_em = new Date().toISOString();

    const { error } = await supabase
      .from("leads")
      .update(atualizacao)
      .eq("id", leadId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/app/leads");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function atualizarLead(formData: FormData): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const id = String(formData.get("id") ?? "");
    const observacoes = String(formData.get("observacoes") ?? "").trim() || null;
    const projetoId = String(formData.get("projeto_id") ?? "") || null;

    const { error } = await supabase
      .from("leads")
      .update({ observacoes, projeto_id: projetoId })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/app/leads");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function removerLead(leadId: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("leads").delete().eq("id", leadId).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app/leads");
    revalidatePath("/app/radar");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function registrarInteracao(
  leadId: string,
  titulo: string,
  canal: CanalContato = "outro",
  conteudo: string | null = null,
): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("interacoes").insert({
      user_id: user.id,
      lead_id: leadId,
      titulo,
      canal,
      conteudo,
    });
    if (error) throw error;

    await supabase
      .from("leads")
      .update({ ultimo_contato_em: new Date().toISOString() })
      .eq("id", leadId)
      .eq("user_id", user.id);

    revalidatePath("/app/leads");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// --------------------------------------------------------------- TEMPLATES

export async function salvarTemplate(formData: FormData): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const id = String(formData.get("id") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const canal = (String(formData.get("canal") ?? "whatsapp") || "whatsapp") as CanalContato;
    const assunto = String(formData.get("assunto") ?? "").trim() || null;
    const corpo = String(formData.get("corpo") ?? "").trim();

    if (!nome) return { ok: false, erro: "Dê um nome ao template." };
    if (!corpo) return { ok: false, erro: "Escreva o corpo da mensagem." };

    if (id) {
      const { error } = await supabase
        .from("templates")
        .update({ nome, canal, assunto, corpo })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("templates")
        .insert({ user_id: user.id, nome, canal, assunto, corpo });
      if (error) throw error;
    }

    revalidatePath("/app/templates");
    revalidatePath("/app/cadencias");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function excluirTemplate(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("templates").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app/templates");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// --------------------------------------------------------------- CADENCIAS

export async function salvarCadencia(formData: FormData): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const id = String(formData.get("id") ?? "").trim();
    const nome = String(formData.get("nome") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim() || null;
    const ativa = String(formData.get("ativa") ?? "true") === "true";
    const etapasBrutas = String(formData.get("etapas") ?? "[]");

    if (!nome) return { ok: false, erro: "Dê um nome à cadência." };

    type EtapaEntrada = {
      dia_offset: number;
      canal: CanalContato;
      template_id: string | null;
      titulo: string | null;
    };

    let etapas: EtapaEntrada[] = [];
    try {
      etapas = JSON.parse(etapasBrutas) as EtapaEntrada[];
    } catch {
      return { ok: false, erro: "Não foi possível ler as etapas." };
    }

    if (etapas.length === 0) return { ok: false, erro: "Adicione pelo menos uma etapa." };

    let cadenciaId = id;

    if (id) {
      const { error } = await supabase
        .from("cadencias")
        .update({ nome, descricao, ativa })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;

      const { error: erroLimpeza } = await supabase
        .from("cadencia_etapas")
        .delete()
        .eq("cadencia_id", id)
        .eq("user_id", user.id);
      if (erroLimpeza) throw erroLimpeza;
    } else {
      const { data, error } = await supabase
        .from("cadencias")
        .insert({ user_id: user.id, nome, descricao, ativa })
        .select("id")
        .single();
      if (error) throw error;
      cadenciaId = data.id;
    }

    const linhas = etapas
      .sort((a, b) => a.dia_offset - b.dia_offset)
      .map((etapa, indice) => ({
        cadencia_id: cadenciaId,
        user_id: user.id,
        ordem: indice + 1,
        dia_offset: Number.isFinite(etapa.dia_offset) ? Math.max(0, etapa.dia_offset) : 0,
        canal: etapa.canal ?? "whatsapp",
        template_id: etapa.template_id || null,
        titulo: etapa.titulo || null,
      }));

    const { error: erroEtapas } = await supabase.from("cadencia_etapas").insert(linhas);
    if (erroEtapas) throw erroEtapas;

    revalidatePath("/app/cadencias");
    return { ok: true, id: cadenciaId };
  } catch (e) {
    return falha(e);
  }
}

export async function excluirCadencia(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase.from("cadencias").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app/cadencias");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/**
 * Matricula um lead numa cadencia: gera os follow-ups agendados com as
 * mensagens ja renderizadas a partir dos templates de cada etapa.
 */
export async function matricularEmCadencia(
  leadId: string,
  cadenciaId: string,
): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();

    const { data: lead, error: erroLead } = await supabase
      .from("leads")
      .select("id, empresa_id, empresas ( nome, telefone, website, instagram, nota, total_avaliacoes, busca_id )")
      .eq("id", leadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (erroLead) throw erroLead;
    if (!lead) return { ok: false, erro: "Lead não encontrado." };

    const empresa = (Array.isArray(lead.empresas) ? lead.empresas[0] : lead.empresas) as
      | {
          nome: string;
          telefone: string | null;
          website: string | null;
          instagram: string | null;
          nota: number | null;
          total_avaliacoes: number;
          busca_id: string;
        }
      | null;

    const { data: busca } = empresa
      ? await supabase
          .from("buscas")
          .select("nicho, cidade")
          .eq("id", empresa.busca_id)
          .maybeSingle()
      : { data: null };

    const { data: perfil } = await supabase
      .from("profiles")
      .select("nome")
      .eq("id", user.id)
      .maybeSingle();

    const { data: etapas, error: erroEtapas } = await supabase
      .from("cadencia_etapas")
      .select("id, dia_offset, canal, template_id, titulo, templates ( corpo )")
      .eq("cadencia_id", cadenciaId)
      .eq("user_id", user.id)
      .order("dia_offset", { ascending: true });
    if (erroEtapas) throw erroEtapas;
    if (!etapas || etapas.length === 0) return { ok: false, erro: "Esta cadência não tem etapas." };

    const { data: matricula, error: erroMatricula } = await supabase
      .from("lead_cadencias")
      .upsert(
        { user_id: user.id, lead_id: leadId, cadencia_id: cadenciaId, status: "ativa" },
        { onConflict: "lead_id,cadencia_id" },
      )
      .select("id")
      .single();
    if (erroMatricula) throw erroMatricula;

    // Substitui follow-ups pendentes anteriores desta matricula.
    await supabase
      .from("follow_ups")
      .delete()
      .eq("lead_cadencia_id", matricula.id)
      .eq("status", "pendente");

    const contexto = contextoDaEmpresa(empresa ?? {}, {
      cidade: busca?.cidade ?? null,
      nicho: busca?.nicho ?? null,
      meuNome: perfil?.nome ?? null,
    });

    const mensagens: Record<string, string | null> = {};
    for (const etapa of etapas) {
      const template = Array.isArray(etapa.templates) ? etapa.templates[0] : etapa.templates;
      const corpo = (template as { corpo?: string } | null)?.corpo ?? null;
      mensagens[etapa.id] = corpo ? aplicarVariaveis(corpo, contexto) : null;
    }

    const agendados = agendarCadencia(
      etapas as unknown as EtapaParaAgendar[],
      new Date(),
      mensagens,
    );

    const { error: erroInsercao } = await supabase.from("follow_ups").insert(
      agendados.map((f) => ({
        user_id: user.id,
        lead_id: leadId,
        lead_cadencia_id: matricula.id,
        etapa_id: f.etapa_id,
        canal: f.canal,
        agendado_para: f.agendado_para,
        mensagem: f.mensagem,
        status: "pendente" as const,
      })),
    );
    if (erroInsercao) throw erroInsercao;

    revalidatePath("/app/leads");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function cancelarMatricula(leadCadenciaId: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();

    await supabase
      .from("follow_ups")
      .update({ status: "cancelado" })
      .eq("lead_cadencia_id", leadCadenciaId)
      .eq("user_id", user.id)
      .eq("status", "pendente");

    const { error } = await supabase
      .from("lead_cadencias")
      .update({ status: "cancelada", encerrada_em: new Date().toISOString() })
      .eq("id", leadCadenciaId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/app/leads");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// -------------------------------------------------------------- FOLLOW-UPS

export async function marcarFollowUpEnviado(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();

    const { data: followUp, error } = await supabase
      .from("follow_ups")
      .update({ status: "enviado", executado_em: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("lead_id, canal")
      .maybeSingle();
    if (error) throw error;

    if (followUp) {
      await supabase
        .from("leads")
        .update({ ultimo_contato_em: new Date().toISOString() })
        .eq("id", followUp.lead_id)
        .eq("user_id", user.id);

      await supabase.from("interacoes").insert({
        user_id: user.id,
        lead_id: followUp.lead_id,
        canal: followUp.canal,
        titulo: "Follow-up enviado",
      });
    }

    revalidatePath("/app");
    revalidatePath("/app/leads");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function cancelarFollowUp(id: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase
      .from("follow_ups")
      .update({ status: "cancelado" })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// ------------------------------------------------------------------ CONTA

export async function atualizarPerfil(formData: FormData): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const nome = String(formData.get("nome") ?? "").trim();

    const { error } = await supabase
      .from("profiles")
      .update({ nome: nome || null })
      .eq("id", user.id);
    if (error) throw error;

    await supabase.auth.updateUser({ data: { full_name: nome || null } });

    revalidatePath("/app/configuracoes");
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

export async function trocarSenha(formData: FormData): Promise<Resposta> {
  try {
    const { supabase } = await exigirUsuario();
    const senha = String(formData.get("senha") ?? "");
    const confirmacao = String(formData.get("confirmacao") ?? "");

    if (senha.length < 6) return { ok: false, erro: "A senha precisa ter ao menos 6 caracteres." };
    if (senha !== confirmacao) return { ok: false, erro: "As senhas não conferem." };

    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error) throw error;

    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Cria os templates e a cadência iniciais para uma conta nova. */
export async function criarConteudoInicial(): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();

    const { TEMPLATES_INICIAIS } = await import("@/lib/templates");
    const { CADENCIA_PADRAO } = await import("@/lib/cadencias");

    const { count } = await supabase
      .from("templates")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    if ((count ?? 0) > 0) return { ok: true };

    const { data: templates, error: erroTemplates } = await supabase
      .from("templates")
      .insert(TEMPLATES_INICIAIS.map((t) => ({ ...t, user_id: user.id })))
      .select("id, nome");
    if (erroTemplates) throw erroTemplates;

    const { data: cadencia, error: erroCadencia } = await supabase
      .from("cadencias")
      .insert({
        user_id: user.id,
        nome: CADENCIA_PADRAO.nome,
        descricao: CADENCIA_PADRAO.descricao,
      })
      .select("id")
      .single();
    if (erroCadencia) throw erroCadencia;

    await supabase.from("cadencia_etapas").insert(
      CADENCIA_PADRAO.etapas.map((etapa, indice) => ({
        cadencia_id: cadencia.id,
        user_id: user.id,
        ordem: etapa.ordem,
        dia_offset: etapa.dia_offset,
        canal: etapa.canal,
        titulo: etapa.titulo,
        template_id: templates?.[indice]?.id ?? null,
      })),
    );

    revalidatePath("/app/templates");
    revalidatePath("/app/cadencias");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// ------------------------------------------------------ FILA DE WHATSAPP

/**
 * Marca a empresa como contatada pela fila de envio manual (/app/enviar-mensagem).
 * Independente do funil de leads: a fila roda direto sobre `empresas`.
 */
export async function marcarContatadoFila(empresaId: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase
      .from("empresas")
      .update({ contatado_fila_em: new Date().toISOString() })
      .eq("id", empresaId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/app/enviar-mensagem");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

/** Desfaz a marcação (o botão "Desfazer" logo após enviar). */
export async function desfazerContatadoFila(empresaId: string): Promise<Resposta> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { error } = await supabase
      .from("empresas")
      .update({ contatado_fila_em: null })
      .eq("id", empresaId)
      .eq("user_id", user.id);
    if (error) throw error;

    revalidatePath("/app/enviar-mensagem");
    return { ok: true };
  } catch (e) {
    return falha(e);
  }
}

// --------------------------------------------------- PREVIA DE SITE (IA)

export type RespostaPrevia = Resposta & { prompt?: string; restantes?: number; limite?: number };

/**
 * Gera o prompt de previa de site via Gemini. Cota diaria TECNICA (nao e
 * plano): derivada por contagem de linhas criadas hoje no fuso do Brasil,
 * sem contador mutavel pra resetar.
 */
export async function gerarPreviaSite(empresaId: string): Promise<RespostaPrevia> {
  try {
    const { supabase, user } = await exigirUsuario();
    const { limitePadraoPrevias, montarPromptPrevia } = await import("@/lib/gemini");
    const { inicioDoDiaBrasil } = await import("@/lib/fuso-brasil");

    const limite = limitePadraoPrevias();

    const { count: usadasHoje } = await supabase
      .from("previas_site")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("criado_em", inicioDoDiaBrasil().toISOString());

    if ((usadasHoje ?? 0) >= limite) {
      return {
        ok: false,
        erro: `Você já usou as ${limite} prévias de hoje. O limite volta à meia-noite (horário de Brasília).`,
        restantes: 0,
        limite,
      };
    }

    const { data: empresa, error: erroEmpresa } = await supabase
      .from("empresas")
      .select(
        "id, nome, categoria, endereco, telefone, nota, total_avaliacoes, instagram, website, fotos_total, busca_id",
      )
      .eq("id", empresaId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (erroEmpresa) throw erroEmpresa;
    if (!empresa) return { ok: false, erro: "Empresa não encontrada." };

    const { data: busca } = await supabase
      .from("buscas")
      .select("nicho, cidade")
      .eq("id", empresa.busca_id)
      .maybeSingle();

    const prompt = await montarPromptPrevia({
      nome: empresa.nome,
      nicho: busca?.nicho ?? empresa.categoria ?? "negócio local",
      categoria: empresa.categoria,
      cidade: busca?.cidade ?? null,
      endereco: empresa.endereco,
      telefone: empresa.telefone,
      nota: empresa.nota,
      totalAvaliacoes: empresa.total_avaliacoes,
      instagram: empresa.instagram,
      temSite: Boolean(empresa.website),
      totalFotos: empresa.fotos_total,
    });

    const { error: erroInsercao } = await supabase.from("previas_site").insert({
      user_id: user.id,
      empresa_id: empresaId,
      modelo: process.env.GEMINI_MODEL || "gemini-flash-latest",
      prompt_gerado: prompt,
    });
    if (erroInsercao) throw erroInsercao;

    revalidatePath("/app/previas");
    revalidatePath(`/app/resultados/${empresa.busca_id}`);

    return { ok: true, prompt, restantes: limite - (usadasHoje ?? 0) - 1, limite };
  } catch (e) {
    return falha(e) as RespostaPrevia;
  }
}

export type ContextoPrevia = {
  usadasHoje: number;
  limite: number;
  historico: { id: string; prompt_gerado: string; criado_em: string }[];
};

/** Cota usada hoje + historico de previas dessa empresa (abre o painel sem gastar cota). */
export async function obterContextoPrevia(empresaId: string): Promise<ContextoPrevia> {
  const { supabase, user } = await exigirUsuario();
  const { limitePadraoPrevias } = await import("@/lib/gemini");
  const { inicioDoDiaBrasil } = await import("@/lib/fuso-brasil");

  const [{ count }, { data: historico }] = await Promise.all([
    supabase
      .from("previas_site")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("criado_em", inicioDoDiaBrasil().toISOString()),
    supabase
      .from("previas_site")
      .select("id, prompt_gerado, criado_em")
      .eq("empresa_id", empresaId)
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false })
      .limit(10),
  ]);

  return {
    usadasHoje: count ?? 0,
    limite: limitePadraoPrevias(),
    historico: historico ?? [],
  };
}
