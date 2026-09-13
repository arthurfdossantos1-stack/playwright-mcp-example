/**
 * Gerador de previa de site (Gemini, tier gratuito).
 *
 * O RastroLead NAO gera o site em si - gera um PROMPT completo e detalhado
 * que o usuario copia e cola em outra ferramenta de geracao de site (Claude,
 * v0, bolt.new etc). A chave fica só no servidor, nunca no bundle do client.
 */

const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export class ErroGemini extends Error {
  readonly status: number;
  constructor(mensagem: string, status = 502) {
    super(mensagem);
    this.name = "ErroGemini";
    this.status = status;
  }
}

export function limitePadraoPrevias(): number {
  const bruto = Number(process.env.PREVIAS_LIMITE_DIARIO);
  return Number.isFinite(bruto) && bruto > 0 ? bruto : 5;
}

function modeloAtual(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
}

function chaveApi(): string {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    throw new ErroGemini(
      "GEMINI_API_KEY não configurada. Crie uma chave gratuita em aistudio.google.com/apikey e adicione no .env.local.",
      500,
    );
  }
  return chave;
}

export type DadosEmpresaPrevia = {
  nome: string;
  nicho: string;
  categoria: string | null;
  cidade: string | null;
  endereco: string | null;
  telefone: string | null;
  nota: number | null;
  totalAvaliacoes: number;
  instagram: string | null;
  temSite: boolean;
  totalFotos: number;
};

/** Monta a instrução enviada ao Gemini com os dados reais do lead. */
function montarInstrucao(dados: DadosEmpresaPrevia): string {
  const linhas = [
    `Nome do negócio: ${dados.nome}`,
    `Ramo/nicho: ${dados.nicho}${dados.categoria ? ` (categoria Google: ${dados.categoria})` : ""}`,
    `Cidade: ${dados.cidade ?? "não informada"}`,
    `Endereço: ${dados.endereco ?? "não informado"}`,
    `Telefone: ${dados.telefone ?? "não informado"}`,
    `Avaliação no Google: ${dados.nota != null ? `${dados.nota.toFixed(1)} (${dados.totalAvaliacoes} avaliações)` : "sem avaliações"}`,
    `Instagram encontrado: ${dados.instagram ?? "não encontrado"}`,
    `Site atual: ${dados.temSite ? "já tem site" : "não tem site"}`,
    `Fotos disponíveis no perfil do Google: ${dados.totalFotos}`,
  ];

  return `Você é um redator especialista em briefings para geração de sites com IA.

Com base EXCLUSIVAMENTE nos dados reais abaixo de uma empresa brasileira, escreva um prompt completo e pronto para ser colado em uma ferramenta geradora de sites com IA (como Claude, v0 ou bolt.new). O prompt deve pedir a criação de uma prévia de site de uma página para este negócio.

Dados reais coletados:
${linhas.map((l) => `- ${l}`).join("\n")}

O prompt que você gerar deve:
1. Apresentar o nome, ramo e cidade do negócio.
2. Sugerir os serviços prováveis para esse tipo de negócio (com base no nicho, já que não temos uma lista real de serviços).
3. Sugerir um tom visual e uma paleta de cores coerente com o segmento (ex.: clínica = tons suaves e confiáveis; academia = cores vibrantes e enérgicas).
4. Recomendar as seções do site: Hero, Serviços, Sobre, Contato (e outras se fizer sentido para o nicho).
5. Incluir o telefone e endereço reais nos dados de contato, se informados.
6. Instruir EXPLICITAMENTE a IA que vai gerar o site a NÃO inventar depoimentos de clientes, prêmios, números de clientes atendidos ou qualquer dado que não foi fornecido aqui.
7. Ser objetivo: no máximo 300 palavras.

Responda APENAS com o prompt final, pronto para copiar e colar. Não adicione explicações antes ou depois, não use markdown, não use aspas envolvendo o texto todo.`;
}

/**
 * Chama a API do Gemini (tier gratuito) e devolve o prompt de previa pronto.
 * Nunca falha silenciosamente: erro de rede/API vira ErroGemini com mensagem
 * clara pro usuario.
 */
export async function montarPromptPrevia(dados: DadosEmpresaPrevia): Promise<string> {
  const chave = chaveApi();
  const modelo = modeloAtual();
  const instrucao = montarInstrucao(dados);

  const resposta = await fetch(`${GEMINI_URL_BASE}/${modelo}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": chave,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: instrucao }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 700 },
    }),
    cache: "no-store",
  });

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new ErroGemini(
      `Gemini respondeu ${resposta.status}: ${texto.slice(0, 300)}`,
      resposta.status === 429 ? 429 : 502,
    );
  }

  const json = (await resposta.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const textoGerado = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");

  if (!textoGerado?.trim()) {
    throw new ErroGemini("O Gemini não retornou nenhum texto. Tente novamente.");
  }

  return textoGerado.trim();
}
