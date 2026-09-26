import type { Metadata } from "next";
import { PaginaLegal } from "@/components/marketing/PaginaLegal";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Como o RastroLead coleta, usa e protege seus dados.",
  alternates: { canonical: "/privacidade" },
};

export default function Privacidade() {
  return (
    <PaginaLegal titulo="Política de privacidade" atualizadoEm="26 de setembro de 2026">
      <h2>1. Quem somos</h2>
      <p>
        O RastroLead é uma ferramenta de prospecção B2B. Esta política explica quais dados tratamos,
        para quê, e quais são os seus direitos segundo a Lei Geral de Proteção de Dados (Lei
        13.709/2018).
      </p>

      <h2>2. Dados que coletamos</h2>
      <h3>Dados da sua conta</h3>
      <ul>
        <li>E-mail e senha (armazenada com hash pelo provedor de autenticação);</li>
        <li>Nome e foto, quando você entra com o Google;</li>
        <li>Data de criação e de último acesso.</li>
      </ul>

      <h3>Dados que você produz na plataforma</h3>
      <ul>
        <li>Termos das varreduras (nicho e cidade) e seus resultados;</li>
        <li>Leads selecionados, status no funil e observações;</li>
        <li>Templates de mensagem, cadências e follow-ups agendados;</li>
        <li>Projetos criados para organizar seu trabalho.</li>
      </ul>

      <h3>Dados públicos de empresas</h3>
      <p>
        As varreduras retornam informações públicas de estabelecimentos comerciais obtidas via
        Google Places API: nome, endereço, telefone comercial, site, categoria, nota e número de
        avaliações. Quando a empresa possui site, acessamos a página inicial para identificar um
        eventual link de Instagram.
      </p>
      <p>
        São dados de pessoa jurídica divulgados publicamente pelo próprio estabelecimento. Não
        coletamos dados pessoais sensíveis, não compramos listas e não enriquecemos contatos com
        dados de pessoas físicas.
      </p>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Autenticar você e manter sua sessão ativa;</li>
        <li>Executar as varreduras e exibir os resultados priorizados pelo Radar;</li>
        <li>Salvar seus leads, templates, cadências e projetos;</li>
        <li>Agendar e disparar os lembretes de follow-up;</li>
        <li>Proteger a infraestrutura contra abuso (limite técnico por IP e por usuário).</li>
      </ul>
      <p>
        Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins publicitários.
        Não há processamento de pagamento, portanto nenhum dado financeiro é tratado.
      </p>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — banco de dados e autenticação. Armazena sua conta e seus
          dados de trabalho.
        </li>
        <li>
          <strong>Google Places API</strong> — recebe o termo de busca (nicho e cidade) para
          retornar a lista de empresas. Não enviamos dados da sua conta.
        </li>
        <li>
          <strong>Google Identity</strong> — apenas se você optar por entrar com o Google.
        </li>
      </ul>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>
        Seus dados ficam armazenados enquanto sua conta existir. Ao excluir a conta, os dados
        associados são removidos. Registros técnicos de proteção contra abuso são descartados
        automaticamente em poucos minutos.
      </p>

      <h2>6. Seus direitos</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Acessar e corrigir seus dados em <strong>Configurações</strong>;</li>
        <li>Solicitar a exportação dos dados que você produziu;</li>
        <li>Excluir sua conta e todos os dados vinculados;</li>
        <li>Revogar a conexão com o Google.</li>
      </ul>
      <p>
        Para exercer qualquer desses direitos:{" "}
        <a href="mailto:contato@rastrolead.com.br">contato@rastrolead.com.br</a>.
      </p>

      <h3>Se você recebeu uma mensagem e não quer mais</h3>
      <p>
        Você não precisa de conta, nem de explicar o motivo. Informe o número em{" "}
        <a href="/nao-quero-receber">
          <strong>rastrolead.com.br/nao-quero-receber</strong>
        </a>{" "}
        e ele sai na hora.
      </p>
      <p>
        O pedido tem três efeitos imediatos: o número sai de qualquer envio que ainda não
        aconteceu, novas buscas não o trazem de volta, e o bloqueio vale para{" "}
        <strong>todos os usuários</strong> da plataforma — não só para quem entrou em contato.
        Guardamos apenas o número, porque é o mínimo necessário para reconhecê-lo e manter a
        recusa valendo.
      </p>

      <h2>7. Segurança</h2>
      <p>
        O acesso aos dados é isolado por usuário com Row Level Security no banco: cada conta
        enxerga apenas os próprios registros. A comunicação acontece sempre por HTTPS e as chaves
        administrativas ficam restritas ao servidor.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Se esta política mudar de forma relevante, avisaremos por e-mail ou dentro do produto antes
        da mudança entrar em vigor.
      </p>
    </PaginaLegal>
  );
}
