/**
 * Preferencia de tema (claro / escuro / sistema).
 *
 * Fica em localStorage, nao em cookie: ler cookie no layout tornaria TODA
 * pagina dinamica e tiraria a landing do build estatico. O script de
 * `ANTI_PISCADA` roda antes da primeira pintura e aplica `data-theme` no
 * <html>, entao nao existe flash de tela branca.
 */

export type Tema = "claro" | "escuro" | "sistema";

export const CHAVE_TEMA = "rastrolead:tema";

export const TEMAS: { id: Tema; rotulo: string }[] = [
  { id: "claro", rotulo: "Claro" },
  { id: "escuro", rotulo: "Escuro" },
  { id: "sistema", rotulo: "Do sistema" },
];

/** Aplica o tema no documento. `sistema` remove o atributo e deixa o CSS decidir. */
export function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  if (tema === "sistema") raiz.removeAttribute("data-theme");
  else raiz.setAttribute("data-theme", tema === "escuro" ? "dark" : "light");
}

export function lerTema(): Tema {
  try {
    const valor = localStorage.getItem(CHAVE_TEMA);
    if (valor === "claro" || valor === "escuro" || valor === "sistema") return valor;
  } catch {
    /* modo privado / storage bloqueado: cai no padrao */
  }
  return "sistema";
}

export function gravarTema(tema: Tema) {
  try {
    localStorage.setItem(CHAVE_TEMA, tema);
  } catch {
    /* sem storage o tema vale so para esta navegacao */
  }
}

/**
 * Roda inline no <head>, antes de qualquer pintura. Mantido minusculo e sem
 * dependencia porque bloqueia a renderizacao por alguns microssegundos.
 */
export const ANTI_PISCADA = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  CHAVE_TEMA,
)});if(t==="escuro")document.documentElement.setAttribute("data-theme","dark");else if(t==="claro")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();`;
