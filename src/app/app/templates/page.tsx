import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { GerenciadorTemplates } from "@/components/app/GerenciadorTemplates";
import type { Template } from "@/lib/types";

export const metadata: Metadata = { title: "Templates de mensagem" };

export default async function PaginaTemplates() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("templates")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <>
      <CabecalhoPagina
        titulo="Templates de mensagem"
        descricao="Escreva uma vez, reaproveite sempre. As variáveis são trocadas pelos dados reais do lead no momento do envio. Crie quantos quiser."
      />
      <GerenciadorTemplates templates={(data ?? []) as Template[]} />
    </>
  );
}
