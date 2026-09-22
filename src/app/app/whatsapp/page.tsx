import type { Metadata } from "next";
import { criarClienteServidor } from "@/lib/supabase/server";
import { CabecalhoPagina } from "@/components/app/Cabecalho";
import { PainelWhatsapp } from "@/components/app/PainelWhatsapp";
import type { Template } from "@/lib/types";

export const metadata: Metadata = { title: "Disparo automático" };

export default async function PaginaWhatsapp() {
  const supabase = await criarClienteServidor();
  const { data: templates } = await supabase
    .from("templates")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <>
      <CabecalhoPagina
        titulo="Disparo automático"
        descricao="Conecte um número e dispare para os leads do funil. O envio é espaçado e tem teto diário — disparo em rajada queima o número."
      />
      <PainelWhatsapp templates={(templates ?? []) as Template[]} />
    </>
  );
}
