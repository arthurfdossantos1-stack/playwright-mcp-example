import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { PreviewBusca } from "@/components/marketing/PreviewBusca";
import { Faq } from "@/components/marketing/Faq";
import { MockupDashboard, MockupFunil } from "@/components/marketing/MockupDashboard";

export const metadata: Metadata = {
  title: "RastroLead — Rastreie empresas. Encontre clientes.",
  description:
    "Encontre empresas por nicho e cidade, descubra quem ainda não tem site ou Instagram e organize o contato do primeiro olá ao fechamento. Gratuito, sem planos e sem limites.",
  alternates: { canonical: "/" },
};

const DORES = [
  {
    titulo: "Horas garimpando no Google Maps",
    texto:
      "Você abre aba por aba, copia telefone por telefone e no fim do dia tem meia dúzia de contatos — nenhum deles qualificado.",
    icone: (
      <path d="M12 6v6l4 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    titulo: "Dados espalhados em três planilhas",
    texto:
      "Uma planilha com a lista, outra com quem você já chamou, um bloco de notas com o que respondeu. Sempre falta contexto na hora do contato.",
    icone: (
      <path
        d="M4 5h16v14H4zM4 10h16M10 10v9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    titulo: "Abordagem repetitiva que ninguém responde",
    texto:
      "A mesma mensagem colada para todo mundo, sem contexto do negócio e sem lembrete de retorno. O follow-up simplesmente não acontece.",
    icone: (
      <path
        d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 21l2-4.9A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

/**
 * Contorno de cada numeral: azul → vermelho (Radar) → azul-claro → verde,
 * acompanhando a jornada do lead até o fechamento.
 */
const CORES_PASSO = ["#bfdbfe", "#fecdd3", "#bae6fd", "#a7f3d0"];

const PASSOS = [
  {
    numero: "01",
    titulo: "Pesquise",
    texto:
      "Informe o nicho e a cidade — por exemplo, “clínica odontológica” em “Campinas”. O RastroLead varre a base do Google e traz nome, endereço, telefone, site, nota e avaliações de cada empresa.",
  },
  {
    numero: "02",
    titulo: "Priorize (Radar)",
    texto:
      "O Radar de Oportunidades classifica cada empresa automaticamente: sem site vira prioridade alta, poucas avaliações vira média-alta, sem Instagram vira média. Você começa pelo topo da lista.",
  },
  {
    numero: "03",
    titulo: "Selecione",
    texto:
      "Escolha as empresas que fazem sentido, envie para o funil e gere a mensagem a partir dos seus templates com {{empresa}}, {{cidade}} e {{nicho}} já preenchidos.",
  },
  {
    numero: "04",
    titulo: "Acompanhe",
    texto:
      "Arraste o lead entre Novo, Contatado, Respondeu e Fechado. Coloque-o numa cadência e o RastroLead agenda os follow-ups dos dias 0, 3 e 7 para você.",
  },
];

const RECURSOS = [
  {
    titulo: "Busca por localização + nicho",
    texto:
      "Varreduras por cidade, região ou bairro com dados direto da base do Google Places. Sem limite de empresas por varredura e sem limite de varreduras por mês.",
    icone: <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titulo: "Radar de Oportunidades",
    texto:
      "Prioridade calculada na hora: quem não tem site, quem tem poucas avaliações e quem você ainda não tocou aparece primeiro.",
    icone: <path d="M12 3a9 9 0 1 0 9 9M12 12l6-6M12 12a3 3 0 1 0 0 .01" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titulo: "Descoberta de Instagram",
    texto:
      "Quando a empresa tem site, o RastroLead abre a página e procura o perfil do Instagram. O que não for encontrado vira sinal de oportunidade.",
    icone: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.5h.01" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titulo: "Templates com variáveis",
    texto:
      "Escreva uma vez e reaproveite sempre. {{empresa}}, {{cidade}} e {{nicho}} são trocados pelos dados reais do lead na hora de enviar.",
    icone: <path d="M4 5h16M4 10h16M4 15h10M4 20h7" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titulo: "Follow-up e cadências",
    texto:
      "Monte sequências como dia 0, dia 3 e dia 7. O agendador roda sozinho e avisa quando cada follow-up vence — nenhum contato fica pelo caminho.",
    icone: <path d="M8 3v4M16 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    titulo: "Funil e projetos",
    texto:
      "Kanban de Novo a Fechado e organização por cliente ou campanha. Tudo liberado, para todas as contas, sem exceção.",
    icone: <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

const DEPOIMENTOS = [
  {
    nome: "Marina Alves",
    papel: "Social media · Campinas",
    texto:
      "Em uma tarde levantei 40 clínicas da minha cidade e descobri 14 sem site nenhum. Foi a lista de prospecção mais fácil que já montei.",
  },
  {
    nome: "Rafael Lima",
    papel: "Agência de tráfego · Belo Horizonte",
    texto:
      "O Radar mudou minha rotina: eu parava de falar com quem já tinha tudo pronto e passei a focar em quem realmente precisava.",
  },
  {
    nome: "Juliana Prado",
    papel: "Consultora comercial · Curitiba",
    texto:
      "As cadências resolveram meu maior problema, que era esquecer o segundo contato. Hoje o follow-up acontece sozinho na minha agenda.",
  },
];

function Estrelas() {
  return (
    <div className="flex gap-0.5" aria-label="5 de 5 estrelas">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4 fill-amber-400" aria-hidden="true">
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.22l-4.94 2.6.94-5.5-4-3.9 5.53-.8L10 1.6Z" />
        </svg>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <Header />

      <main>
        {/* ---------------------------------------------------------- HERO */}
        <section id="inicio" className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(37,99,235,0.14),rgba(255,255,255,0))]"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
            {/* min-w-0 nos dois itens: sem isso o mockup (min-content ~413px)
                estica a trilha do grid e o texto do hero fica cortado no celular. */}
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 rounded-full border border-marca-200 bg-marca-50 px-3 py-1 text-xs font-semibold text-marca-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-acento-500" />
                  Gratuito, sem planos e sem limite de uso
                </span>

                <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem]">
                  Rastreie empresas.
                  <br />
                  <span className="texto-gradiente">Encontre clientes.</span>
                </h1>

                <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-slate-600">
                  O RastroLead encontra empresas por nicho e cidade, mostra quem ainda não tem site
                  ou Instagram e organiza seu contato do primeiro olá até o fechamento. Tudo em um
                  lugar só — e liberado por completo assim que você cria a conta.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/auth?modo=cadastro" className="botao-primario text-base">
                    Começar agora, é grátis
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link href="#demonstracao" className="botao-secundario text-base">
                    Ver como funciona
                  </Link>
                </div>

                <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                  {[
                    { valor: "Ilimitado", rotulo: "buscas por mês" },
                    { valor: "Sem corte", rotulo: "empresas por varredura" },
                    { valor: "R$ 0", rotulo: "para sempre" },
                  ].map((item) => (
                    <div key={item.rotulo}>
                      <dt className="text-lg font-bold text-slate-900">{item.valor}</dt>
                      <dd className="mt-0.5 text-xs leading-snug text-slate-500">{item.rotulo}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* O mockup não encolhe abaixo de ~413px; em telas estreitas ele
                  rola dentro da própria caixa em vez de ser cortado. */}
              <div className="rolagem-suave min-w-0 overflow-x-auto pb-1 lg:overflow-visible lg:pl-4">
                <MockupDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- DEMONSTRAÇÃO */}
        <section id="demonstracao" className="border-t border-slate-200 bg-slate-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
                Demonstração
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Escolha o segmento e a cidade. O resto é com a gente.
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
                Assim fica uma varredura de verdade dentro do RastroLead: a lista das empresas com os
                dados públicos do Google e o selo de prioridade que o Radar calcula sozinho.
              </p>
            </div>

            <div className="mt-10">
              <PreviewBusca />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ O PROBLEMA */}
        <section id="problema" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
                O problema
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Prospectar não deveria consumir o seu dia inteiro
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
                Quem vende serviço para outras empresas conhece bem esse ciclo — e ele quase sempre
                termina com uma planilha abandonada.
              </p>
            </div>

            {/* Linhas com filete, não três cards iguais: o peso fica no texto. */}
            <div className="mx-auto mt-12 max-w-3xl">
              {DORES.map((dor) => (
                <div
                  key={dor.titulo}
                  className="flex gap-4 border-t border-slate-200 py-5 last:border-b sm:gap-5"
                >
                  <span className="mt-0.5 shrink-0 text-rose-500">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {dor.icone}
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{dor.titulo}</h3>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-slate-600">{dor.texto}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- COMO FUNCIONA */}
        <section id="como-funciona" className="border-y border-slate-200 bg-slate-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
                Como funciona
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Quatro passos, do nicho ao cliente fechado
              </h2>
            </div>

            {/* Numerais vazados e grandes: viram estrutura visual, não enfeite. */}
            <div className="mx-auto mt-12 max-w-4xl">
              {PASSOS.map((passo, indice) => (
                <div
                  key={passo.numero}
                  className="flex items-start gap-5 border-t border-slate-200 bg-white px-4 py-6 last:border-b sm:gap-7 sm:px-6"
                >
                  <span
                    className="num-passo shrink-0"
                    style={{ WebkitTextStrokeColor: CORES_PASSO[indice] }}
                    aria-hidden="true"
                  >
                    {passo.numero}
                  </span>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-slate-900">{passo.titulo}</h3>
                    <p className="mt-2 max-w-xl text-[0.95rem] leading-relaxed text-slate-600">
                      {passo.texto}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 grid items-center gap-8 lg:grid-cols-2">
              <MockupFunil />
              <div>
                <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                  O acompanhamento fica visível — e o follow-up acontece
                </h3>
                <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-600">
                  Cada lead percorre um funil simples: Novo, Contatado, Respondeu e Fechado. Ao
                  colocar o lead numa cadência, o RastroLead agenda as etapas e um worker dispara os
                  follow-ups vencidos automaticamente, sem você precisar lembrar de nada.
                </p>
                <Link href="/auth?modo=cadastro" className="botao-primario mt-6">
                  Criar minha conta gratuita
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- RECURSOS */}
        <section id="recursos" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
                Recursos
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Tudo liberado, para todas as contas
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-600">
                Não há recurso bloqueado, nem versão reduzida. O que você vê aqui é exatamente o que
                você recebe ao entrar.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {RECURSOS.map((recurso) => (
                <div key={recurso.titulo} className="cartao p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-marca-50 text-marca-600">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      {recurso.icone}
                    </svg>
                  </span>
                  <h3 className="mt-4 text-base font-bold text-slate-900">{recurso.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{recurso.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------- PROVA SOCIAL */}
        <section className="border-y border-slate-200 bg-slate-50/60 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">
                Quem já usa
              </span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Feito para quem precisa de cliente nesta semana
              </h2>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {DEPOIMENTOS.map((d) => (
                <figure key={d.nome} className="cartao flex h-full flex-col p-6">
                  <Estrelas />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-700">
                    “{d.texto}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-marca-100 text-xs font-bold text-marca-700">
                      {d.nome
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{d.nome}</span>
                      <span className="block text-xs text-slate-500">{d.papel}</span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------ FAQ */}
        <section id="faq" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-marca-600">FAQ</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Perguntas frequentes
              </h2>
            </div>

            <div className="mt-10">
              <Faq />
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ CTA FINAL */}
        <section className="px-4 pb-20 sm:px-6">
          {/* Fundo escuro com textura de pontos no lugar do gradiente largo:
              o gradiente fica só no headline do hero, onde ele significa algo. */}
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-[#020617] px-6 py-16 text-center sm:px-12">
            <span
              className="textura-pontos pointer-events-none absolute inset-0 text-[#1e293b]"
              aria-hidden="true"
            />
            <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-[#ffffff] sm:text-4xl">
              Comece agora, gratuito
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-[#94a3b8]">
              Crie sua conta, escolha um nicho e uma cidade e rode a primeira varredura em menos de
              um minuto. Sem cartão, sem plano, sem limite.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth?modo=cadastro"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffffff] px-6 py-3 text-base font-semibold text-[#1d4ed8] shadow-sm transition hover:bg-[#eff6ff]"
              >
                Criar conta gratuita
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href="/guia-prospeccao-b2b"
                className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-3 text-base font-semibold text-[#ffffff] transition hover:bg-white/10"
              >
                Ler o guia de prospecção
              </Link>
            </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
