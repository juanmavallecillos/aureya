// lib/dealers.ts
export type DealerInfo = { id: string; name: string; country: string; flag: string };

export const DEALERS: Record<string, DealerInfo> = {
  andorrano: { id: "andorrano", name: "Andorrano Joyería", country: "ES", flag: "🇪🇸" },
  tuorovalemas: { id: "tuorovalemas", name: "Tu Oro Vale Más", country: "ES", flag: "🇪🇸" },
  // añade más aquí según vayas incorporando scrapers
};

export function dealerLabel(id?: string) {
  const d = id ? DEALERS[id] : undefined;
  return d ? `${d.flag} ${d.name}` : (id ?? "—");
}
