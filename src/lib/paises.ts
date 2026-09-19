/**
 * Países suportados na varredura.
 *
 * Cada entrada carrega o que a busca e a fila de WhatsApp precisam:
 * - `codigo`   -> regionCode da Places API (ISO 3166-1 alpha-2)
 * - `idioma`   -> languageCode dos resultados
 * - `ddi`      -> prefixo internacional, para montar o número E.164
 * - `celular`  -> como reconhecer um celular pelos dígitos NACIONAIS
 *                 (sem DDI), já que cada país numera de um jeito
 * - `sugestoes`-> nichos de exemplo NO IDIOMA do país: o Google Places
 *                 responde muito melhor a "dental clinic in Miami" do que
 *                 a "clínica odontológica in Miami"
 */

export type Pais = {
  codigo: string;
  nome: string;
  idioma: string;
  ddi: string;
  /** Quantidades de dígitos nacionais aceitas. */
  digitosNacionais: number[];
  /**
   * Confirma que os dígitos nacionais têm cara de celular.
   * Recebe o número já sem DDI e sem formatação.
   */
  celular: (nacional: string) => boolean;
  exemploCidade: string;
  /** Nichos de exemplo, escritos no idioma do país. */
  sugestoes: string[];
  /**
   * Nome com artigo, para a frase sair certa em português:
   * "as maiores praças DO BRASIL", "DA ESPANHA", "DE PORTUGAL".
   */
  comArtigo: string;
  /**
   * Regiões varridas na busca de país inteiro.
   *
   * O Text Search do Google corta em ~60 resultados por consulta, entao
   * "imobiliaria" sozinho NAO cobre um pais: devolve 60 espalhados e para.
   * Varrer as maiores praças e juntar, deduplicando por place_id, e o que
   * chega perto de cobertura nacional de verdade.
   */
  regioes: string[];
};

export const PAISES: Pais[] = [
  {
    codigo: "BR",
    nome: "Brasil",
    idioma: "pt-BR",
    ddi: "55",
    digitosNacionais: [11],
    // DDD (2) + 9 + 8 dígitos
    celular: (n) => n.length === 11 && n[2] === "9",
    exemploCidade: "Campinas — SP",
    comArtigo: "do Brasil",
    regioes: [
      "São Paulo SP",
      "Rio de Janeiro RJ",
      "Belo Horizonte MG",
      "Brasília DF",
      "Curitiba PR",
      "Porto Alegre RS",
      "Salvador BA",
      "Recife PE",
      "Fortaleza CE",
      "Goiânia GO",
      "Campinas SP",
      "Manaus AM",
      "Belém PA",
      "Florianópolis SC",
      "Vitória ES",
      "Natal RN",
      "Cuiabá MT",
      "Campo Grande MS",
      "João Pessoa PB",
      "Maceió AL",
      "Teresina PI",
      "São Luís MA",
      "Londrina PR",
      "Ribeirão Preto SP",
      "Joinville SC",
      "Uberlândia MG",
    ],
    sugestoes: [
      "clínica odontológica",
      "academia de musculação",
      "imobiliária",
      "pet shop",
      "escritório de contabilidade",
      "salão de beleza",
      "restaurante",
      "escola de idiomas",
    ],
  },
  {
    codigo: "PT",
    nome: "Portugal",
    idioma: "pt-PT",
    ddi: "351",
    digitosNacionais: [9],
    // Telemóveis começam com 9
    celular: (n) => n.length === 9 && n.startsWith("9"),
    exemploCidade: "Lisboa",
    comArtigo: "de Portugal",
    regioes: [
      "Lisboa",
      "Porto",
      "Braga",
      "Coimbra",
      "Faro",
      "Aveiro",
      "Setúbal",
      "Funchal",
      "Leiria",
      "Viseu",
    ],
    sugestoes: [
      "clínica dentária",
      "ginásio",
      "imobiliária",
      "loja de animais",
      "gabinete de contabilidade",
      "cabeleireiro",
      "restaurante",
      "escola de línguas",
    ],
  },
  {
    codigo: "ES",
    nome: "Espanha",
    idioma: "es-ES",
    ddi: "34",
    digitosNacionais: [9],
    // Móveis começam com 6 ou 7
    celular: (n) => n.length === 9 && /^[67]/.test(n),
    exemploCidade: "Madrid",
    comArtigo: "da Espanha",
    regioes: [
      "Madrid",
      "Barcelona",
      "Valencia",
      "Sevilla",
      "Zaragoza",
      "Málaga",
      "Bilbao",
      "Murcia",
      "Palma",
      "Alicante",
      "Valladolid",
      "Vigo",
    ],
    sugestoes: [
      "clínica dental",
      "gimnasio",
      "inmobiliaria",
      "tienda de mascotas",
      "asesoría contable",
      "peluquería",
      "restaurante",
      "academia de idiomas",
    ],
  },
  {
    codigo: "US",
    nome: "Estados Unidos",
    idioma: "en-US",
    ddi: "1",
    digitosNacionais: [10],
    // Não há prefixo de móvel: aceita qualquer número válido de 10 dígitos
    // (área e central não podem começar com 0 ou 1).
    celular: (n) => n.length === 10 && /^[2-9]\d{2}[2-9]\d{6}$/.test(n),
    exemploCidade: "Miami, FL",
    comArtigo: "dos Estados Unidos",
    regioes: [
      "New York NY",
      "Los Angeles CA",
      "Chicago IL",
      "Houston TX",
      "Phoenix AZ",
      "Philadelphia PA",
      "San Antonio TX",
      "San Diego CA",
      "Dallas TX",
      "Miami FL",
      "Atlanta GA",
      "Boston MA",
      "Seattle WA",
      "Denver CO",
      "Orlando FL",
    ],
    sugestoes: [
      "dental clinic",
      "gym",
      "real estate agency",
      "pet shop",
      "accounting firm",
      "hair salon",
      "restaurant",
      "language school",
    ],
  },
  {
    codigo: "MX",
    nome: "México",
    idioma: "es-MX",
    ddi: "52",
    digitosNacionais: [10],
    celular: (n) => n.length === 10 && /^[1-9]/.test(n),
    exemploCidade: "Guadalajara",
    comArtigo: "do México",
    regioes: [
      "Ciudad de México",
      "Guadalajara",
      "Monterrey",
      "Puebla",
      "Tijuana",
      "León",
      "Querétaro",
      "Mérida",
      "Cancún",
      "Toluca",
    ],
    sugestoes: [
      "clínica dental",
      "gimnasio",
      "inmobiliaria",
      "tienda de mascotas",
      "despacho contable",
      "estética",
      "restaurante",
      "escuela de idiomas",
    ],
  },
  {
    codigo: "AR",
    nome: "Argentina",
    idioma: "es-AR",
    ddi: "54",
    digitosNacionais: [10],
    celular: (n) => n.length === 10 && /^[1-9]/.test(n),
    exemploCidade: "Buenos Aires",
    comArtigo: "da Argentina",
    regioes: [
      "Buenos Aires",
      "Córdoba",
      "Rosario",
      "Mendoza",
      "La Plata",
      "Mar del Plata",
      "Salta",
      "Tucumán",
      "Santa Fe",
      "Neuquén",
    ],
    sugestoes: [
      "clínica odontológica",
      "gimnasio",
      "inmobiliaria",
      "pet shop",
      "estudio contable",
      "peluquería",
      "restaurante",
      "instituto de idiomas",
    ],
  },
];

export const PAIS_PADRAO = "BR";

export function acharPais(codigo: string | null | undefined): Pais {
  return PAISES.find((p) => p.codigo === codigo) ?? PAISES[0];
}
