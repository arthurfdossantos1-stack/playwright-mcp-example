/**
 * Medidor de força de senha (usado no cadastro).
 *
 * Heuristica local, sem chamada de rede: comprimento, variedade de caracteres
 * e penalidade pra padroes obvios. Nao substitui a protecao contra senhas
 * vazadas do Supabase (Authentication > Password security), que checa contra
 * o HaveIBeenPwned - as duas coisas se complementam.
 */

export type ForcaSenha = {
  /** 0 a 4 */
  score: number;
  rotulo: string;
  /** Classe Tailwind da barra preenchida. */
  cor: string;
  /** O que falta pra ficar mais forte (vazio quando ja esta no topo). */
  sugestoes: string[];
};

const PADROES_FRACOS = [
  /^(.)\1+$/, // todos os caracteres iguais: aaaaaa
  /012345|123456|234567|345678|456789|567890/,
  /abcdef|qwerty|asdfgh|zxcvbn/i,
  /senha|password|admin|teste|123mudar/i,
];

export function avaliarForcaSenha(senha: string): ForcaSenha {
  if (!senha) {
    return { score: 0, rotulo: "", cor: "bg-slate-200", sugestoes: [] };
  }

  const temMinuscula = /[a-z]/.test(senha);
  const temMaiuscula = /[A-Z]/.test(senha);
  const temNumero = /\d/.test(senha);
  const temSimbolo = /[^A-Za-z0-9]/.test(senha);

  let score = 0;
  if (senha.length >= 8) score += 1;
  if (senha.length >= 12) score += 1;
  if (temMinuscula && temMaiuscula) score += 1;
  if (temNumero) score += 1;
  if (temSimbolo) score += 1;

  // Padrao obvio derruba pro piso, por mais longa que seja.
  const ehObvia = PADROES_FRACOS.some((padrao) => padrao.test(senha));
  if (ehObvia) score = Math.min(score, 1);

  score = Math.max(0, Math.min(4, score));

  const sugestoes: string[] = [];
  if (senha.length < 12) sugestoes.push("use 12 caracteres ou mais");
  if (!(temMinuscula && temMaiuscula)) sugestoes.push("misture maiúsculas e minúsculas");
  if (!temNumero) sugestoes.push("inclua um número");
  if (!temSimbolo) sugestoes.push("inclua um símbolo");
  if (ehObvia) sugestoes.unshift("evite sequências e palavras óbvias");

  const ROTULOS = ["Muito fraca", "Fraca", "Razoável", "Forte", "Muito forte"];
  const CORES = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-lime-500",
    "bg-emerald-500",
  ];

  return {
    score,
    rotulo: ROTULOS[score],
    cor: CORES[score],
    sugestoes: score >= 4 ? [] : sugestoes.slice(0, 2),
  };
}
