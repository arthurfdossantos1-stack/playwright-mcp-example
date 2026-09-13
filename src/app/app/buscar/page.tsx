import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { FormularioBusca } from "@/components/app/FormularioBusca";
import type { Projeto } from "@/lib/types";

export const metadata: Metadata = { title: "Nova varredura" };

export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string }>;
}) {
  const { projeto } = await searchParams;
  const supabase = await criarClienteServidor();

  const { data: projetos } = await supabase
    .from("projetos")
    .select("*")
    .eq("arquivado", false)
    .order("criado_em", { ascending: false });

  return (
    <>
      <CabecalhoPagina
        titulo="Nova varredura"
        descricao="Informe o nicho e a cidade. Trazemos todas as empresas que a base do Google devolver — sem limite de resultados e sem limite de varreduras."
      />

      <FormularioBusca projetos={(projetos ?? []) as Projeto[]} projetoPadrao={projeto ?? null} />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          {
            titulo: "Recorte a região",
            texto:
              "Uma cidade grande não cabe em uma busca só. Rode varreduras por bairro (“academia em Moema”) para cobrir tudo.",
          },
          {
            titulo: "Teste subnichos",
            texto:
              "“clínica de ortodontia” e “clínica de implante” trazem empresas que “clínica odontológica” não traz.",
          },
          {
            titulo: "Deixe o Radar ordenar",
            texto:
              "Depois da varredura, abra o Radar: ele já separa quem não tem site, quem tem poucas avaliações e quem você ainda não tocou.",
          },
        ].map((dica) => (
          <div key={dica.titulo} className="cartao p-5">
            <h3 className="text-sm font-bold text-slate-900">{dica.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{dica.texto}</p>
          </div>
        ))}
      </div>
    </>
  );
}
