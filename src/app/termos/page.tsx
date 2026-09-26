import type { Metadata } from "next";
import { PaginaLegal } from "@/components/marketing/PaginaLegal";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Termos de uso do RastroLead.",
  alternates: { canonical: "/termos" },
  robots: { index: true, follow: true },
};

export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de uso" atualizadoEm="26 de setembro de 2026">
      <h2>1. Sobre estes termos</h2>
      <p>
        Estes termos regulam o uso do RastroLead, uma ferramenta de prospecção B2B que organiza
        informações públicas de empresas e ajuda no acompanhamento do contato comercial. Ao criar
        uma conta, você concorda com o que está descrito aqui.
      </p>

      <h2>2. O serviço é gratuito</h2>
      <p>
        O RastroLead é oferecido de forma gratuita. Não existem planos, assinaturas, créditos,
        período de teste ou cobrança de qualquer natureza. Todos os recursos — varreduras, Radar de
        Oportunidades, templates, cadências, funil e projetos — estão disponíveis para qualquer
        conta autenticada, sem limite de uso.
      </p>
      <p>
        Por não haver contraprestação financeira, o serviço é fornecido no estado em que se
        encontra, sem garantia de disponibilidade ininterrupta.
      </p>

      <h2>3. Sua conta</h2>
      <ul>
        <li>Você é responsável pelas credenciais de acesso e pela atividade realizada na conta.</li>
        <li>Informe dados verdadeiros no cadastro e mantenha seu e-mail atualizado.</li>
        <li>Você pode encerrar sua conta a qualquer momento, o que remove seus dados do serviço.</li>
      </ul>

      <h2>4. Origem dos dados de empresas</h2>
      <p>
        Os dados exibidos nas varreduras vêm de fontes públicas, especialmente da Google Places API.
        São as mesmas informações que qualquer pessoa vê ao pesquisar um negócio no Google Maps:
        nome, endereço, telefone comercial, site, categoria, nota e número de avaliações.
      </p>
      <p>
        O RastroLead não cria, não valida e não garante a exatidão dessas informações. Elas podem
        estar desatualizadas na origem. Confira os dados antes de qualquer contato comercial.
      </p>

      <h2>5. Uso responsável</h2>
      <p>Ao usar o RastroLead, você se compromete a não:</p>
      <ul>
        <li>Enviar mensagens não solicitadas em massa, spam ou conteúdo enganoso;</li>
        <li>Violar a Lei Geral de Proteção de Dados (LGPD) ou normas de comunicação comercial;</li>
        <li>Revender, redistribuir ou comercializar as listas geradas na plataforma;</li>
        <li>Tentar contornar os controles técnicos de proteção da infraestrutura;</li>
        <li>Automatizar acessos de forma abusiva ou fora das interfaces oferecidas.</li>
      </ul>
      <p>
        O RastroLead não envia mensagens por você. Todo contato com as empresas listadas parte de
        você, pelo canal que escolher, e é de sua inteira responsabilidade.
      </p>

      <h2>6. Controles técnicos</h2>
      <p>
        Para proteger a infraestrutura e a cota das APIs utilizadas, aplicamos um limite técnico de
        requisições por minuto por usuário e por endereço IP. Isso não é um plano nem uma limitação
        comercial: é apenas uma proteção contra abuso, e não restringe o quanto você pode usar o
        produto no dia a dia.
      </p>

      <h2>7. Disponibilidade e alterações</h2>
      <p>
        Podemos alterar, suspender ou descontinuar funcionalidades a qualquer momento. Mudanças
        relevantes nestes termos serão comunicadas por e-mail ou dentro do próprio produto.
      </p>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        O RastroLead não se responsabiliza por decisões comerciais tomadas a partir dos dados
        exibidos, por resultados de campanhas de prospecção nem por indisponibilidades de serviços
        de terceiros dos quais dependemos.
      </p>

      <h2>9. Contato</h2>
      <p>
        Dúvidas sobre estes termos: <a href="mailto:contato@rastrolead.com.br">contato@rastrolead.com.br</a>.
      </p>
    </PaginaLegal>
  );
}
