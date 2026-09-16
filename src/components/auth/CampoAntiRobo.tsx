"use client";

import { useEffect, useRef, useState } from "react";

/** Nome do campo-isca. Um humano nunca vê; robô de formulário preenche tudo. */
export const CAMPO_ISCA = "empresa_site";

/** Tempo mínimo, em ms, entre abrir o formulário e enviar. */
const MINIMO_MS = 2500;

export type VerificadorAntiRobo = () => string | null;

/**
 * Duas barreiras baratas contra robô de cadastro em massa, sem serviço externo:
 *
 * 1. Campo-isca escondido — invisível para gente, preenchido por robô burro.
 * 2. Tempo de preenchimento — ninguém digita e-mail, senha e confirmação em
 *    menos de 2,5 segundos.
 *
 * Não substitui o CAPTCHA do Supabase (que roda no servidor de autenticação e
 * não dá para pular); é a camada que funciona sem nenhuma configuração.
 * Devolve o verificador para o formulário chamar antes de enviar.
 */
export function useAntiRobo(): { verificar: VerificadorAntiRobo; campo: React.ReactNode } {
  const abertoEm = useRef(Date.now());
  const [isca, setIsca] = useState("");

  useEffect(() => {
    abertoEm.current = Date.now();
  }, []);

  function verificar(): string | null {
    if (isca.trim() !== "") return "Não foi possível validar o envio. Recarregue a página.";
    if (Date.now() - abertoEm.current < MINIMO_MS) {
      return "Espere um instante antes de enviar — revise os dados e tente de novo.";
    }
    return null;
  }

  const campo = (
    <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
      <label htmlFor={CAMPO_ISCA}>Deixe este campo em branco</label>
      <input
        id={CAMPO_ISCA}
        name={CAMPO_ISCA}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        value={isca}
        onChange={(e) => setIsca(e.target.value)}
      />
    </div>
  );

  return { verificar, campo };
}
