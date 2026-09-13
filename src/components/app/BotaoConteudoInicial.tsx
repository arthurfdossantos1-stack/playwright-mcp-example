"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { criarConteudoInicial } from "@/app/app/acoes";

export function BotaoConteudoInicial() {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  return (
    <button
      type="button"
      disabled={pendente}
      onClick={() =>
        iniciar(async () => {
          await criarConteudoInicial();
          router.refresh();
        })
      }
      className="botao-primario !px-4 !py-2 !text-sm"
    >
      {pendente ? "Criando…" : "Criar templates e cadência"}
    </button>
  );
}
