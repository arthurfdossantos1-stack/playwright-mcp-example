/** Formatadores compartilhados (pt-BR). */

export function formatarData(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const data = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(data);
}

export function formatarDataHora(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const data = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

export function tempoRelativo(valor: string | Date | null | undefined): string {
  if (!valor) return "—";
  const data = typeof valor === "string" ? new Date(valor) : valor;
  if (Number.isNaN(data.getTime())) return "—";

  const diffSegundos = Math.round((data.getTime() - Date.now()) / 1000);
  const formatador = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  const escalas: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [2592000, "day"],
  ];

  const abs = Math.abs(diffSegundos);
  if (abs < 60) return formatador.format(diffSegundos, "second");
  if (abs < 3600) return formatador.format(Math.round(diffSegundos / 60), "minute");
  if (abs < 86400) return formatador.format(Math.round(diffSegundos / 3600), "hour");
  if (abs < 2592000) return formatador.format(Math.round(diffSegundos / 86400), "day");
  void escalas;
  return formatarData(data);
}

export function limparUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function apenasDigitos(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

// linkWhatsApp foi removida: ela prefixava "55" em todo numero sem DDI, o que
// transformava um lead de Portugal, Espanha, Argentina, Mexico ou Estados
// Unidos numa conversa com um brasileiro aleatorio. Use
// linkWhatsappEmpresa de @/lib/whatsapp, que parte do E.164 ja normalizado na
// varredura e prefere nao oferecer o botao a mandar para o numero errado.

export function iniciais(nome: string | null | undefined): string {
  if (!nome) return "RL";
  const partes = nome.trim().split(/\s+/).slice(0, 2);
  return partes.map((p) => p[0]?.toUpperCase() ?? "").join("") || "RL";
}
