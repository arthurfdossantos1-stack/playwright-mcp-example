/**
 * Ponte com o servidor de WhatsApp (pasta servidor-whatsapp/).
 *
 * O navegador NUNCA fala com ele direto: a chave ficaria exposta e o endereço
 * do servidor viraria alvo. Tudo passa por rotas do app, que guardam o
 * segredo do lado do servidor.
 */

export class ErroWorker extends Error {
  readonly status: number;
  constructor(mensagem: string, status = 502) {
    super(mensagem);
    this.name = "ErroWorker";
    this.status = status;
  }
}

export function workerConfigurado(): boolean {
  return Boolean(process.env.WHATSAPP_WORKER_URL && process.env.WHATSAPP_WORKER_SECRET);
}

export async function chamarWorker<T>(
  caminho: string,
  opcoes: { metodo?: "GET" | "POST"; corpo?: unknown } = {},
): Promise<T> {
  const base = process.env.WHATSAPP_WORKER_URL?.replace(/\/$/, "");
  const chave = process.env.WHATSAPP_WORKER_SECRET;

  if (!base || !chave) {
    throw new ErroWorker(
      "O servidor de WhatsApp não está configurado. Faltam WHATSAPP_WORKER_URL e WHATSAPP_WORKER_SECRET.",
      400,
    );
  }

  let resposta: Response;
  try {
    resposta = await fetch(`${base}${caminho}`, {
      method: opcoes.metodo ?? "GET",
      headers: { "Content-Type": "application/json", "x-chave": chave },
      body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined,
      cache: "no-store",
      // O servidor pode estar hibernando no plano gratuito da hospedagem.
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    throw new ErroWorker(
      "Não consegui falar com o servidor de WhatsApp. Confira se ele está no ar.",
      503,
    );
  }

  const dados = (await resposta.json().catch(() => null)) as T & { erro?: string };
  if (!resposta.ok) {
    throw new ErroWorker(dados?.erro ?? `Servidor respondeu ${resposta.status}.`, resposta.status);
  }
  return dados;
}

export type EstadoWorker = {
  conectado: boolean;
  numero: string | null;
  qr: string | null;
  tetoHoje: number;
  enviadasHoje: number;
  campanha: {
    estado: "rodando" | "parada" | "concluida";
    motivo: string | null;
    total: number;
    enviados: number;
    pulados: number;
    falhas: number;
  } | null;
};
