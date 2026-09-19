/**
 * Caixa de saida da fila de WhatsApp.
 *
 * O problema que ela resolve: ao tocar em "Abrir WhatsApp" o celular troca de
 * aplicativo e o navegador pode congelar ou descartar a pagina antes de a
 * gravacao chegar ao servidor. Sem isso, o lead reaparecia na fila quando a
 * pessoa voltava ao site — parecia que o envio nao tinha contado.
 *
 * Duas camadas:
 *   1. `fetch(..., { keepalive: true })` — o navegador conclui a requisicao
 *      mesmo com a pagina indo embora.
 *   2. Esta caixa de saida — o que nao confirmou fica gravado e e reenviado
 *      no proximo carregamento. Cobre o caso do aparelho ficar sem rede.
 */

export const CHAVE_PENDENTES = "rastrolead:fila-pendentes";

export type MarcacaoPendente = {
  empresaId: string;
  leadId: string | null;
  /** ISO do momento do clique, só para depurar entregas atrasadas. */
  em: string;
};

/**
 * Validade da caixa de saida.
 *
 * Enquanto uma marcacao esta pendente o lead fica escondido da fila. Se ela
 * nunca conseguir ser entregue (o lead foi apagado, por exemplo), sem prazo
 * o lead sumiria pra sempre. Uma semana e tempo de sobra pra reconectar.
 */
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

function ler(): MarcacaoPendente[] {
  try {
    const bruto = localStorage.getItem(CHAVE_PENDENTES);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    if (!Array.isArray(dados)) return [];

    const corte = Date.now() - VALIDADE_MS;
    const vivas = (dados as MarcacaoPendente[]).filter((m) => {
      const quando = Date.parse(m?.em ?? "");
      return m?.empresaId && (!Number.isFinite(quando) || quando >= corte);
    });
    if (vivas.length !== dados.length) gravar(vivas);
    return vivas;
  } catch {
    return [];
  }
}

function gravar(itens: MarcacaoPendente[]) {
  try {
    if (itens.length === 0) localStorage.removeItem(CHAVE_PENDENTES);
    else localStorage.setItem(CHAVE_PENDENTES, JSON.stringify(itens));
  } catch {
    /* sem storage a caixa de saída não persiste; o keepalive ainda vale */
  }
}

function adicionar(marcacao: MarcacaoPendente) {
  const atuais = ler().filter((m) => m.empresaId !== marcacao.empresaId);
  gravar([...atuais, marcacao]);
}

function remover(empresaId: string) {
  gravar(ler().filter((m) => m.empresaId !== empresaId));
}

async function enviar(
  corpo: { empresaId: string; leadId: string | null; desfazer?: boolean },
  comKeepalive: boolean,
): Promise<boolean> {
  try {
    const resposta = await fetch("/api/fila/contatado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      keepalive: comKeepalive,
    });
    return resposta.ok;
  } catch {
    return false;
  }
}

/**
 * Marca o contato. Grava na caixa de saída ANTES de tentar a rede, para que
 * mesmo um fechamento imediato do app deixe rastro para o próximo reenvio.
 */
export async function marcarContato(empresaId: string, leadId: string | null): Promise<boolean> {
  adicionar({ empresaId, leadId, em: new Date().toISOString() });
  const ok = await enviar({ empresaId, leadId }, true);
  if (ok) remover(empresaId);
  return ok;
}

export async function desfazerContato(empresaId: string, leadId: string | null): Promise<boolean> {
  remover(empresaId);
  return enviar({ empresaId, leadId, desfazer: true }, false);
}

/**
 * Reenvia o que ficou pendente. Chamada ao abrir a tela da fila: é isso que
 * impede o lead já contatado de voltar a aparecer.
 */
export async function reenviarPendentes(): Promise<number> {
  const pendentes = ler();
  if (pendentes.length === 0) return 0;

  let entregues = 0;
  for (const marcacao of pendentes) {
    const ok = await enviar({ empresaId: marcacao.empresaId, leadId: marcacao.leadId }, false);
    if (ok) {
      remover(marcacao.empresaId);
      entregues += 1;
    }
  }
  return entregues;
}

/** Ids ainda não confirmados — a fila os esconde até a entrega. */
export function idsPendentes(): string[] {
  return ler().map((m) => m.empresaId);
}
