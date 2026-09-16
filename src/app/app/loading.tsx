import { Esqueleto } from "@/components/app/Esqueleto";

/**
 * Vale para /app e para toda rota filha que não tenha o seu próprio
 * `loading.tsx`. É o que faz o clique no menu responder na hora.
 */
export default function Carregando() {
  return <Esqueleto />;
}
