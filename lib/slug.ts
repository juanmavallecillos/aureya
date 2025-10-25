// /lib/slug.ts

export type ProductSlugInput = {
  metal: string;            // "gold" | "silver" | ...
  form: string;             // "bar" | "coin" | ...
  weight_g: number;         // gramos reales
  brand?: string | null;
  series?: string | null;
  sku: string;              // p. ej. "AU-500G-SEMPSA"

  // 🆕 Opcionales para controlar el token de peso en la URL
  // - weight_label: etiqueta humana ("1/2oz", "1/4oz", "2,5g", …)
  // - weight_label_slug: etiqueta lista para URL ("1_2oz", "1_4oz", "2_5g", …)
  weight_label?: string | null;
  weight_label_slug?: string | null;
};

/** Normaliza strings a slug SEO (minúsculas, sin acentos, guiones simples). */
function slugify(raw?: string | null): string {
  const s = (raw || "").toString().trim().toLowerCase();
  if (!s) return "";
  // quita acentos/diacríticos
  const noDiac = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // mantiene a-z0-9 y separa con '-'
  return noDiac
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** metal/form a token en español para URL legible */
function metalEs(m: string): string {
  const x = (m || "").toLowerCase();
  if (x === "gold"  || x === "oro")    return "oro";
  if (x === "silver"|| x === "plata")  return "plata";
  if (x === "platinum")                return "platino";
  if (x === "palladium")               return "paladio";
  return slugify(x);
}
function formEs(f: string): string {
  const x = (f || "").toLowerCase();
  if (x === "bar" || x === "lingote" || x === "lingotes") return "lingote";
  if (x === "coin"|| x === "moneda"  || x === "monedas")  return "moneda";
  return slugify(x);
}

/** Convierte etiqueta humana a token slug (p. ej. "1/2oz" -> "1_2oz", "2,5g" -> "2_5g"). */
function weightLabelToSlug(label?: string | null): string {
  const s = (label || "").trim();
  if (!s) return "";
  return s.replace(/\//g, "_").replace(/,/g, "_").toLowerCase();
}

/** Token de peso por defecto desde gramos (1oz, 100g, …). */
function weightTokenFromGrams(weight_g: number): string {
  const w = Number(weight_g);
  if (!Number.isFinite(w) || w <= 0) return "";
  // 1 oz troy
  if (Math.abs(w - 31.1034768) < 0.08) return "1oz";
  // 1 kg exacto
  if (Math.abs(w - 1000) < 0.5) return "1kg";
  // por defecto, redondeo a entero g
  const n = Math.round(w);
  return `${n}g`;
}

/**
 * Devuelve el slug canónico: "<form>-<metal>-<peso>-<serie|marca>-<marca?>--<SKU>"
 * - Siempre incluye `--<SKU>` al final para routing estable.
 * - Omite serie/marca si no están.
 */
export function productSlug(input: ProductSlugInput): string {
  const form  = formEs(input.form);
  const metal = metalEs(input.metal);

  // 🆕 Prioridad para el token de peso:
  //  1) weight_label_slug (ya listo)
  //  2) weight_label → lo convertimos a slug
  //  3) derivar desde weight_g (lógica de siempre)
  const wt =
    (input.weight_label_slug && input.weight_label_slug.trim()) ? input.weight_label_slug.trim().toLowerCase() :
    (input.weight_label && weightLabelToSlug(input.weight_label)) ||
    weightTokenFromGrams(input.weight_g);

  // Preferimos serie para SEO; si no hay, usamos marca
  const main   = slugify(input.series) || slugify(input.brand);
  // Si hay ambos, añadimos la marca como sufijo corto
  const brandS = slugify(input.brand);

  const nameParts = [form, metal, wt, main].filter(Boolean);
  // Evitar repetir dos veces la misma palabra
  const name = nameParts.join("-").replace(/-+/g, "-");

  const maybeBrandSuffix = main && brandS && brandS !== main ? `-${brandS}` : "";
  const left = (name + maybeBrandSuffix).replace(/-+/g, "-").replace(/^-|-$/g, "");

  const skuPart = String(input.sku || "").trim();
  return `${left}--${skuPart}`;
}

/**
 * Extrae el SKU a partir del parámetro de ruta `[...slug]`.
 * Admite: ["producto-bonito--SKU"], ["…", "producto-bonito--SKU"], o directamente ["SKU"].
 */
export function extractSkuFromSlugParam(slugParam: string[] | string | undefined): string {
  if (!slugParam) return "";
  const last = Array.isArray(slugParam) ? slugParam[slugParam.length - 1] : slugParam;
  if (!last) return "";
  // si viene "nombre--SKU", nos quedamos con lo de después de la última doble raya
  if (last.includes("--")) {
    const parts = last.split("--");
    return parts[parts.length - 1] || "";
  }
  // si no hay doble raya, asumimos que el propio segmento es el SKU (fallback)
  return last;
}

/** Útil si quieres comprobar canonicidad sin redirigir todavía. */
export function isCanonicalProductSlug(slugParam: string[] | string | undefined, expected: string): boolean {
  const last = Array.isArray(slugParam) ? slugParam[slugParam.length - 1] : slugParam;
  return !!last && last === expected;
}
