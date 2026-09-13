/**
 * Substituicao de variaveis nos templates de mensagem.
 * Variaveis suportadas: {{empresa}}, {{cidade}}, {{nicho}}, {{telefone}},
 * {{site}}, {{instagram}}, {{nota}}, {{avaliacoes}}, {{meu_nome}}.
 */

export type VariavelTemplate = {
  chave: string;
  rotulo: string;
  exemplo: string;
};

export const VARIAVEIS_TEMPLATE: VariavelTemplate[] = [
  { chave: "empresa", rotulo: "Nome da empresa", exemplo: "Clínica Sorriso Real" },
  { chave: "cidade", rotulo: "Cidade da busca", exemplo: "Campinas" },
  { chave: "nicho", rotulo: "Nicho da busca", exemplo: "clínica odontológica" },
  { chave: "telefone", rotulo: "Telefone", exemplo: "(19) 3333-4444" },
  { chave: "site", rotulo: "Site", exemplo: "clinicasorrisoreal.com.br" },
  { chave: "instagram", rotulo: "Instagram", exemplo: "@clinicasorrisoreal" },
  { chave: "nota", rotulo: "Nota no Google", exemplo: "4.6" },
  { chave: "avaliacoes", rotulo: "Total de avaliações", exemplo: "37" },
  { chave: "meu_nome", rotulo: "Seu nome", exemplo: "Arthur" },
];

export type ContextoTemplate = Record<string, string | number | null | undefined>;

/**
 * Troca {{variavel}} pelos valores do contexto.
 * Variavel sem valor vira string vazia (e nao "{{empresa}}" solto na mensagem).
 */
export function aplicarVariaveis(corpo: string, contexto: ContextoTemplate): string {
  return corpo.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, chave: string) => {
    const valor = contexto[chave.toLowerCase()];
    if (valor === null || valor === undefined) return "";
    return String(valor);
  });
}

/** Lista as variaveis usadas em um corpo de template. */
export function variaveisUsadas(corpo: string): string[] {
  const encontradas = new Set<string>();
  const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(corpo)) !== null) {
    encontradas.add(match[1].toLowerCase());
  }
  return [...encontradas];
}

/** Variaveis usadas que nao existem na lista oficial. */
export function variaveisDesconhecidas(corpo: string): string[] {
  const conhecidas = new Set(VARIAVEIS_TEMPLATE.map((v) => v.chave));
  return variaveisUsadas(corpo).filter((v) => !conhecidas.has(v));
}

export type DadosEmpresaTemplate = {
  nome?: string | null;
  telefone?: string | null;
  website?: string | null;
  instagram?: string | null;
  nota?: number | null;
  total_avaliacoes?: number | null;
};

/** Monta o contexto a partir da empresa + dados da busca. */
export function contextoDaEmpresa(
  empresa: DadosEmpresaTemplate,
  extras: { cidade?: string | null; nicho?: string | null; meuNome?: string | null } = {},
): ContextoTemplate {
  return {
    empresa: empresa.nome ?? "",
    telefone: empresa.telefone ?? "",
    site: empresa.website ? empresa.website.replace(/^https?:\/\//, "").replace(/\/$/, "") : "",
    instagram: empresa.instagram
      ? `@${empresa.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`
      : "",
    nota: empresa.nota != null ? empresa.nota.toFixed(1) : "",
    avaliacoes: empresa.total_avaliacoes ?? 0,
    cidade: extras.cidade ?? "",
    nicho: extras.nicho ?? "",
    meu_nome: extras.meuNome ?? "",
  };
}

export const TEMPLATES_INICIAIS = [
  {
    nome: "Primeiro contato — sem site",
    canal: "whatsapp" as const,
    assunto: null,
    corpo:
      "Olá, {{empresa}}! Tudo bem?\n\n" +
      "Sou {{meu_nome}} e trabalho com presença digital para {{nicho}} em {{cidade}}. " +
      "Vi o perfil de vocês no Google e notei que ainda não têm um site próprio — " +
      "hoje isso costuma ser o que mais deixa cliente escapar para o concorrente.\n\n" +
      "Posso te mandar em 2 minutos como isso ficaria para vocês?",
  },
  {
    nome: "Lembrete (dia 3)",
    canal: "whatsapp" as const,
    assunto: null,
    corpo:
      "Oi, {{empresa}}! Passando só para confirmar se minha mensagem chegou.\n\n" +
      "Se fizer sentido, te mando um exemplo rápido do que dá para fazer aí em {{cidade}}. " +
      "Se não for o momento, sem problema — é só me avisar.",
  },
  {
    nome: "Último contato (dia 7)",
    canal: "whatsapp" as const,
    assunto: null,
    corpo:
      "Olá, {{empresa}}! Este é meu último contato para não virar insistência. :)\n\n" +
      "Deixo meu canal aberto: se em algum momento quiserem falar sobre captar mais clientes " +
      "para {{nicho}} em {{cidade}}, é só chamar. Sucesso por aí!",
  },
  {
    nome: "E-mail de apresentação",
    canal: "email" as const,
    assunto: "Uma ideia rápida para a {{empresa}}",
    corpo:
      "Olá, equipe da {{empresa}},\n\n" +
      "Meu nome é {{meu_nome}}. Atendo {{nicho}} em {{cidade}} e separei duas observações " +
      "sobre a presença digital de vocês no Google (nota {{nota}}, {{avaliacoes}} avaliações).\n\n" +
      "Se quiser, respondo aqui mesmo com as sugestões, sem compromisso.\n\n" +
      "Abraço,\n{{meu_nome}}",
  },
];
