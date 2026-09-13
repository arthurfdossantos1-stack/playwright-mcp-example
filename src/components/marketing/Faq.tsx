"use client";

import { useState } from "react";

const PERGUNTAS = [
  {
    p: "O RastroLead é realmente gratuito?",
    r: "É. Não existem planos, limites de uso, período de teste nem cartão de crédito. Ao criar sua conta você já tem acesso completo a buscas, Radar de Oportunidades, templates, cadências, funil e projetos — tudo ilimitado.",
  },
  {
    p: "De onde vêm os dados das empresas?",
    r: "De fontes públicas da base do Google (Google Places), a mesma informação que aparece quando você pesquisa um negócio no Google Maps: nome, endereço, telefone, site, nota e número de avaliações. O RastroLead só organiza e prioriza esses dados para você.",
  },
  {
    p: "Quantas empresas aparecem em cada varredura?",
    r: "Todas as que a base do Google retorna para aquele nicho naquela cidade. Não cortamos resultados: se a busca trouxer 60 empresas, você vê as 60. Para cobrir uma região grande, vale rodar varreduras por bairro ou por cidade vizinha.",
  },
  {
    p: "Como funciona o Radar de Oportunidades?",
    r: "Depois da varredura, cada empresa recebe uma prioridade automática. Quem não tem site sobe para prioridade alta; quem tem poucas avaliações no Google entra como média-alta; quem não tem Instagram identificado fica como média. Empresas que você ainda não moveu no funil são marcadas como intocadas.",
  },
  {
    p: "Como vocês encontram o Instagram das empresas?",
    r: "Quando a empresa tem site, o RastroLead abre a página inicial e procura links para o Instagram. Se encontrar, o perfil fica salvo junto do lead. Se não encontrar, isso vira um sinal de oportunidade no Radar.",
  },
  {
    p: "O RastroLead envia as mensagens por mim?",
    r: "Não. Você monta os templates com variáveis como {{empresa}} e {{cidade}}, e o RastroLead gera a mensagem pronta e agenda os lembretes da cadência. O envio continua sendo seu, pelo canal que preferir — isso mantém o contato pessoal e evita problemas de spam.",
  },
  {
    p: "O que é uma cadência de follow-up?",
    r: "É a sequência de contatos que você combina com antecedência: dia 0 a primeira mensagem, dia 3 um lembrete, dia 7 o último contato, por exemplo. Ao colocar um lead na cadência, o RastroLead agenda cada etapa e avisa quando cada follow-up vence.",
  },
  {
    p: "Posso separar buscas por cliente?",
    r: "Pode. Os projetos organizam varreduras e leads por cliente ou campanha, e estão liberados para qualquer conta.",
  },
];

export function Faq() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {PERGUNTAS.map((item, i) => {
        const ativo = aberta === i;
        return (
          <div key={item.p}>
            <button
              type="button"
              onClick={() => setAberta(ativo ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50 sm:px-6"
              aria-expanded={ativo}
            >
              <span className="text-[0.95rem] font-semibold text-slate-900">{item.p}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${ativo ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {ativo && (
              <div className="px-5 pb-5 text-sm leading-relaxed text-slate-600 sm:px-6">{item.r}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
