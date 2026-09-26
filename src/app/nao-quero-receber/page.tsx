import type { Metadata } from "next";
import { FormularioDescadastro } from "@/components/marketing/FormularioDescadastro";

export const metadata: Metadata = {
  title: "Não quero receber mensagens",
  description:
    "Remova o seu número da nossa base. O pedido vale na hora e para toda a plataforma.",
  alternates: { canonical: "/nao-quero-receber" },
  robots: { index: true, follow: true },
};

export default function NaoQueroReceber() {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-12 sm:py-16">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Não quero receber mensagens
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Informe o número e ele sai da nossa base agora. Você não precisa criar conta, explicar o
        motivo nem responder mais nada.
      </p>

      <div className="mt-6">
        <FormularioDescadastro />
      </div>

      <section className="mt-8 text-sm leading-relaxed text-slate-600">
        <h2 className="text-base font-bold text-slate-900">Por que você recebeu uma mensagem</h2>
        <p className="mt-2">
          O RastroLead reúne dados de contato que as próprias empresas publicam — no Google Maps,
          em sites e em perfis comerciais — para que prestadores de serviço encontrem clientes.
          Quem te escreveu é um usuário da ferramenta, não nós.
        </p>
        <p className="mt-2">
          Se a mensagem te incomodou, este formulário resolve de forma definitiva. Ele também
          atende ao direito de oposição previsto na{" "}
          <strong>Lei Geral de Proteção de Dados (Lei 13.709/2018)</strong>.
        </p>
        <p className="mt-2">
          Para pedir acesso aos seus dados, correção ou exclusão completa, escreva para o contato
          indicado na nossa{" "}
          <a href="/privacidade" className="font-semibold text-marca-700 underline">
            política de privacidade
          </a>
          .
        </p>
      </section>
    </main>
  );
}
