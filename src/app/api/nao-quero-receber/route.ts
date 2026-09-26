import { NextResponse } from "next/server";
import { z } from "zod";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { checarEmMemoria, chaveRateLimit, ipDoRequest } from "@/lib/rate-limit";
import { PAISES, PAIS_PADRAO } from "@/lib/paises";
import { validarWhatsapp } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Entrada = z.object({
  telefone: z.string().min(6).max(40),
  pais: z.string().length(2).default(PAIS_PADRAO),
});

/**
 * Descadastro pedido pelo proprio titular (LGPD art. 18, oposicao).
 *
 * Sem autenticacao de proposito: exigir conta de quem quer PARAR de receber
 * mensagem seria transformar um direito num obstaculo. Em troca vem o limite
 * por IP, para o formulario aberto nao virar ferramenta de sabotagem em
 * massa — o estrago possivel e pequeno (um lead que deixa de ser abordado),
 * mas nao precisa ser gratuito.
 */
export async function POST(request: Request) {
  const limite = checarEmMemoria(
    chaveRateLimit("descadastro", null, ipDoRequest(request)),
    10,
    60,
  );
  if (!limite.permitido) {
    return NextResponse.json(
      { erro: "Muitos pedidos seguidos. Tente de novo em um minuto." },
      { status: 429 },
    );
  }

  const analise = Entrada.safeParse(await request.json().catch(() => null));
  if (!analise.success) {
    return NextResponse.json({ erro: "Informe um telefone válido." }, { status: 400 });
  }

  const { telefone, pais } = analise.data;
  if (!PAISES.some((p) => p.codigo === pais)) {
    return NextResponse.json({ erro: "País não reconhecido." }, { status: 400 });
  }

  // Grava no mesmo formato que a fila usa. Guardar o que a pessoa digitou
  // faria o bloqueio nunca casar com o numero que seria discado.
  const { e164 } = validarWhatsapp(telefone, pais);
  if (!e164) {
    return NextResponse.json(
      { erro: "Não reconheci esse número como um celular válido. Confira o DDD e o país." },
      { status: 400 },
    );
  }

  const supabase = criarClienteAdmin();
  const { error } = await supabase
    .from("bloqueios")
    .upsert({ telefone_e164: e164, origem: "titular" }, { onConflict: "telefone_e164" });

  if (error) {
    return NextResponse.json({ erro: "Não consegui registrar agora. Tente de novo." }, { status: 500 });
  }

  // O numero volta mascarado: confirma para quem pediu sem servir de consulta
  // para quem quisesse descobrir se um telefone esta na base.
  const visivel = `${e164.slice(0, -4).replace(/\d/g, "•")}${e164.slice(-4)}`;
  return NextResponse.json({ ok: true, numero: visivel });
}
