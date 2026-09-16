import type { Metadata } from "next";
import { PaginaLegal } from "@/components/marketing/PaginaLegal";
import { BotaoPreferenciasCookies } from "@/components/BotaoPreferenciasCookies";

export const metadata: Metadata = {
  title: "Política de cookies",
  description: "Quais cookies o RastroLead usa e para quê.",
  alternates: { canonical: "/cookies" },
};

export default function Cookies() {
  return (
    <PaginaLegal titulo="Política de cookies" atualizadoEm="10 de março de 2025">
      <h2>1. O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos gravados no seu navegador quando você visita um site. Eles
        permitem, por exemplo, que você continue autenticado ao navegar entre páginas.
      </p>

      <h2>2. Cookies que usamos</h2>

      <h3>Estritamente necessários</h3>
      <p>
        São os únicos cookies que o RastroLead grava por padrão. Sem eles o produto não funciona.
      </p>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Finalidade</th>
            <th>Duração</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>sb-access-token</code>
            </td>
            <td>Mantém sua sessão autenticada</td>
            <td>1 hora (renovado automaticamente)</td>
          </tr>
          <tr>
            <td>
              <code>sb-refresh-token</code>
            </td>
            <td>Renova a sessão sem exigir novo login</td>
            <td>Até 30 dias</td>
          </tr>
          <tr>
            <td>
              <code>sb-*-auth-token</code>
            </td>
            <td>Estado da autenticação do Supabase</td>
            <td>Sessão</td>
          </tr>
        </tbody>
      </table>

      <h3>Analíticos e de publicidade</h3>
      <p>
        Não utilizamos cookies de publicidade, remarketing ou rastreamento entre sites. Não há
        pixels de redes sociais nem venda de dados de navegação.
      </p>

      <h2>3. Cookies de terceiros</h2>
      <p>
        Se você optar por entrar com o Google, o próprio Google pode gravar cookies durante o fluxo
        de autenticação, conforme a política de privacidade dele. O RastroLead não tem acesso a
        esses cookies.
      </p>

      <h2>4. Como gerenciar</h2>
      <p>
        Você pode bloquear ou apagar cookies nas configurações do seu navegador. Como usamos apenas
        cookies essenciais, bloqueá-los impedirá que você permaneça autenticado — as páginas
        públicas continuam acessíveis normalmente.
      </p>

      <h2>5. Contato</h2>
      <p>
        Dúvidas: <a href="mailto:contato@rastrolead.com.br">contato@rastrolead.com.br</a>.
      </p>
      <p className="not-prose mt-8">
        <BotaoPreferenciasCookies />
      </p>
    </PaginaLegal>
  );
}
