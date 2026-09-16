// Tipos compartilhados do RastroLead.
// Nao existe nenhum tipo de plano, assinatura ou cobranca: toda conta
// autenticada tem acesso completo e ilimitado.

export type LeadStatus = "novo" | "contatado" | "respondeu" | "fechado";

export type PrioridadeRadar = "alta" | "media_alta" | "media" | "baixa";

export type BuscaStatus = "processando" | "concluida" | "erro";

export type CanalContato = "whatsapp" | "email" | "instagram" | "telefone" | "outro";

export type CadenciaLeadStatus = "ativa" | "pausada" | "concluida" | "cancelada";

export type FollowUpStatus = "pendente" | "pronto" | "enviado" | "cancelado";

export const LEAD_STATUS_ORDEM: LeadStatus[] = ["novo", "contatado", "respondeu", "fechado"];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  fechado: "Fechado",
};

export const PRIORIDADE_LABEL: Record<PrioridadeRadar, string> = {
  alta: "Prioridade alta",
  media_alta: "Prioridade média-alta",
  media: "Prioridade média",
  baixa: "Prioridade baixa",
};

export const PRIORIDADE_CURTA: Record<PrioridadeRadar, string> = {
  alta: "Alta",
  media_alta: "Média-alta",
  media: "Média",
  baixa: "Baixa",
};

export const CANAL_LABEL: Record<CanalContato, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  instagram: "Instagram",
  telefone: "Telefone",
  outro: "Outro",
};

export type Profile = {
  id: string;
  email: string | null;
  nome: string | null;
  avatar_url: string | null;
  criado_em: string;
};

export type Projeto = {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  arquivado: boolean;
  criado_em: string;
};

export type Busca = {
  id: string;
  user_id: string;
  projeto_id: string | null;
  nicho: string;
  cidade: string;
  pais: string;
  termo: string;
  status: BuscaStatus;
  total_resultados: number;
  erro: string | null;
  criado_em: string;
  concluido_em: string | null;
};

export type Empresa = {
  id: string;
  user_id: string;
  busca_id: string;
  place_id: string;
  nome: string;
  endereco: string | null;
  telefone: string | null;
  website: string | null;
  instagram: string | null;
  categoria: string | null;
  nota: number | null;
  total_avaliacoes: number;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  prioridade: PrioridadeRadar;
  score_radar: number;
  motivos_radar: string[];
  whatsapp_e164: string | null;
  whatsapp_verificado: boolean;
  contatado_fila_em: string | null;
  fotos_total: number;
  criado_em: string;
};

export type EmpresaRadar = Empresa & {
  intocado: boolean;
  lead_status: LeadStatus | null;
  lead_id: string | null;
};

export type Lead = {
  id: string;
  user_id: string;
  empresa_id: string;
  projeto_id: string | null;
  status: LeadStatus;
  posicao: number;
  observacoes: string | null;
  ultimo_contato_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type LeadComEmpresa = Lead & {
  empresas: Empresa | null;
  projetos?: Pick<Projeto, "id" | "nome" | "cor"> | null;
};

export type Template = {
  id: string;
  user_id: string;
  nome: string;
  canal: CanalContato;
  assunto: string | null;
  corpo: string;
  criado_em: string;
  atualizado_em: string;
};

export type Cadencia = {
  id: string;
  user_id: string;
  nome: string;
  descricao: string | null;
  ativa: boolean;
  criado_em: string;
};

export type CadenciaEtapa = {
  id: string;
  cadencia_id: string;
  user_id: string;
  ordem: number;
  dia_offset: number;
  canal: CanalContato;
  template_id: string | null;
  titulo: string | null;
  criado_em: string;
};

export type CadenciaComEtapas = Cadencia & {
  cadencia_etapas: CadenciaEtapa[];
};

export type FollowUp = {
  id: string;
  user_id: string;
  lead_id: string;
  lead_cadencia_id: string | null;
  etapa_id: string | null;
  canal: CanalContato;
  agendado_para: string;
  status: FollowUpStatus;
  mensagem: string | null;
  executado_em: string | null;
  criado_em: string;
};

export type PreviaSite = {
  id: string;
  user_id: string;
  empresa_id: string;
  modelo: string;
  prompt_gerado: string;
  criado_em: string;
};

export type PreviaSiteComEmpresa = PreviaSite & {
  empresas: Pick<Empresa, "id" | "nome" | "website"> | null;
};

export type Interacao = {
  id: string;
  user_id: string;
  lead_id: string;
  canal: CanalContato;
  titulo: string;
  conteudo: string | null;
  criado_em: string;
};
