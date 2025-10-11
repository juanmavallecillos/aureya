// lib/faqData.ts
import type { FaqItem } from "@/components/MicroFAQ";
import { InlineLink } from "@/components/MicroFAQ";

// FAQ por sección/página (usa las claves que prefieras: "home", "oro", "plata", etc.)
export const faqBySection: Record<string, FaqItem[]> = {
  home: [
    {
      q: "¿1 oz o 100 g en oro?",
      a: (
        <>
          100&nbsp;g suele ofrecer <strong>prima más baja</strong>; 1&nbsp;oz aporta
          <strong> liquidez internacional</strong>. Compara:{" "}
          <InlineLink href="/oro/lingotes/1oz">lingote 1&nbsp;oz</InlineLink> ·{" "}
          <InlineLink href="/oro/lingotes/100g">lingote 100&nbsp;g</InlineLink>.
        </>
      ),
      aText:
        "100 g suele ofrecer prima más baja; 1 oz aporta liquidez internacional. Compara: lingote 1 oz y lingote 100 g.",
    },
    {
      q: "¿Cada cuánto se actualizan los datos?",
      a: (
        <>
          Publicamos el <strong>mejor precio diario por SKU</strong> y servimos vía CDN.
          En la barra verás “Actualizado: hh:mm (hace X min)”.
        </>
      ),
      aText:
        "Publicamos el mejor precio diario por SKU y servimos vía CDN. En la barra verás “Actualizado: hh:mm (hace X min)”.",
    },
    {
      q: "¿Lingote o moneda?",
      a: (
        <>
          El <strong>lingote</strong> suele tener prima menor; la{" "}
          <strong>moneda</strong> mejora reconocimiento y fraccionabilidad.{" "}
          <InlineLink href="/oro/monedas">Monedas de oro</InlineLink>.
        </>
      ),
      aText:
        "El lingote suele tener prima menor; la moneda mejora reconocimiento y fraccionabilidad.",
    },
    {
      q: "¿La prima incluye el envío?",
      a: (
        <>
          No. Mostramos <strong>Premium (s/envío)</strong>. El envío exacto se confirma
          en la tienda. En plata, a veces se compara contra <em>spot+IVA</em>.
        </>
      ),
      aText:
        "No. Mostramos Premium (s/envío). El envío exacto lo confirma la tienda. En plata puede compararse contra spot+IVA.",
    },
  ],

  oro: [
    {
      q: "¿Qué pureza tiene el oro de inversión?",
      a: <>Lo habitual es <strong>999,9‰ (24k)</strong>. Algunas monedas bullion clásicas (p. ej. Krugerrand) son <strong>22k</strong> pero contienen 1&nbsp;oz de oro puro igualmente.</>,
      aText: "El oro de inversión suele ser 999,9 milésimas (24 quilates). Monedas como el Krugerrand son 22k, pero contienen 1 oz de oro puro."
    },
    {
      q: "¿En qué influye la prima (premium)?",
      a: <>Depende de <strong>tamaño</strong>, <strong>formato</strong> (lingote/moneda), marca y demanda. Por lo general, <strong>más gramos → menor prima por gramo</strong>.</>,
      aText: "La prima depende de tamaño, formato, marca y demanda. A mayor tamaño, suele bajar la prima por gramo."
    },
    {
      q: "¿Lingote o moneda para empezar?",
      a: <>El <strong>lingote</strong> suele tener prima algo menor; la <strong>moneda</strong> aporta reconocimiento y liquidez internacional. Compara <InlineLink href="/oro/lingotes">lingotes</InlineLink> y <InlineLink href="/oro/monedas">monedas</InlineLink>.</>,
      aText: "El lingote suele tener prima menor; la moneda ofrece mayor reconocimiento y liquidez internacional."
    },
    {
      q: "¿Qué tamaños son más comunes?",
      a: <>En oro: <strong>1&nbsp;oz</strong>, <strong>100&nbsp;g</strong>, <strong>50&nbsp;g</strong>, <strong>20&nbsp;g</strong> y <strong>1&nbsp;kg</strong>. Mira los filtros por tamaño en catálogo.</>,
      aText: "Tamaños comunes en oro: 1 oz, 100 g, 50 g, 20 g y 1 kg.",
    },
  ],

  plata: [
    {
      q: "¿La plata lleva IVA en España?",
      a: <>Sí. La <strong>plata nueva</strong> suele llevar IVA. Algunas monedas se venden bajo <em>régimen especial</em>. En nuestras tablas indicamos premium y comparamos contra <em>spot</em> o <em>spot+IVA</em> cuando corresponde.</>,
      aText: "La plata de inversión nueva suele llevar IVA en España. Algunas monedas pueden venderse bajo régimen especial."
    },
    {
      q: "¿Qué tamaños son habituales en plata?",
      a: <>Moneda <strong>1&nbsp;oz</strong> y lingote <strong>1&nbsp;kg</strong> son los más populares. También verás 10&nbsp;oz, 100&nbsp;g y 5&nbsp;kg en ciertas casas.</>,
      aText: "En plata, la moneda de 1 oz y el lingote de 1 kg son los tamaños más comunes."
    },
    {
      q: "¿Por qué cambia tanto la prima en plata?",
      a: <>La plata tiene <strong>coste de fabricación</strong> y logística más relevante frente al valor intrínseco, por eso su prima varía más que en oro y depende mucho del <strong>formato</strong> y la <strong>demanda</strong>.</>,
      aText: "En plata la prima varía más porque el coste de fabricación y logística pesa más frente al valor del metal."
    },
    {
      q: "¿Moneda o lingote de plata?",
      a: <>La <strong>moneda</strong> ofrece mejor liquidez en unidades pequeñas; el <strong>lingote</strong>, normalmente, <strong>menor prima por gramo</strong>. Compara <InlineLink href="/plata/monedas">monedas</InlineLink> y <InlineLink href="/plata/lingotes">lingotes</InlineLink>.</>,
      aText: "La moneda de plata mejora la liquidez por unidad; el lingote suele tener menor prima por gramo."
    }
  ],

  "oro-lingotes": [
    {
      q: "¿Qué diferencia hay entre lingote ‘minted’ y ‘cast’?",
      a: <>El <strong>minted</strong> es troquelado y viene con <em>assay card</em>; el <strong>cast</strong> es colado y suele tener <strong>prima menor</strong>. Ambos son válidos si proceden de refinerías acreditadas.</>,
      aText: "El minted es troquelado y suele venir con assay card; el cast es colado y suele tener menor prima."
    },
    {
      q: "¿Importa la marca del lingote?",
      a: <>Las marcas <strong>LBMA Good Delivery</strong> (PAMP, Heraeus, Valcambi, Argor-Heraeus, Metalor, Umicore…) facilitan recompra y verificación.</>,
      aText: "Las marcas con acreditación LBMA Good Delivery facilitan la recompra y verificación."
    },
    {
      q: "¿Qué tamaños optimizan la prima?",
      a: <>En oro, <strong>100&nbsp;g</strong> y <strong>1&nbsp;oz</strong> suelen equilibrar prima y liquidez. Si buscas coste por gramo bajo, sube a <strong>250&nbsp;g</strong> o <strong>1&nbsp;kg</strong>.</>,
      aText: "100 g y 1 oz suelen equilibrar prima y liquidez; 250 g o 1 kg reducen más el coste por gramo."
    },
    {
      q: "¿Puedo abrir la tarjeta/precinto?",
      a: <>Mejor <strong>no</strong>. Mantener el lingote <em>sealed</em> (tarjeta/precinto) ayuda en la <strong>reventa</strong> y verificación.</>,
      aText: "Conviene no abrir el precinto; mantener el lingote sellado ayuda en la reventa y verificación."
    }
  ],

  "oro-monedas": [
    {
      q: "¿24k vs 22k en monedas de oro?",
      a: <>Monedas como <strong>Maple</strong> o <strong>Britannia</strong> son 24k; <strong>Krugerrand</strong> o <strong>Sovereign</strong> son 22k. Todas contienen su oro fino indicado (1&nbsp;oz, 1/2&nbsp;oz…).</>,
      aText: "Maple y Britannia son 24k; Krugerrand y Sovereign son 22k. Todas contienen la cantidad de oro fino indicada."
    },
    {
      q: "¿Qué monedas tienen mejor liquidez?",
      a: <>Las bullion más conocidas: <strong>Krugerrand</strong>, <strong>Maple</strong>, <strong>Britannia</strong>, <strong>Eagle</strong>, <strong>Filarmónica</strong>. Reconocimiento = <strong>reventa más fácil</strong>.</>,
      aText: "Krugerrand, Maple, Britannia, Eagle y Filarmónica son monedas bullion de gran liquidez."
    },
    {
      q: "¿La prima de la moneda es mayor que la del lingote?",
      a: <>Suele ser <strong>algo mayor</strong> por acabado, tirada y demanda, pero gana en <strong>liquidez internacional</strong>. Compara en <InlineLink href="/oro/monedas">monedas de oro</InlineLink>.</>,
      aText: "La moneda suele tener prima algo mayor que el lingote, a cambio de mayor liquidez."
    },
    {
      q: "¿Importa el año de la moneda?",
      a: <>En bullion estándar no tanto: lo clave es el <strong>estado</strong> y la <strong>autenticidad</strong>. Los años raros interesan solo en numismática.</>,
      aText: "En bullion estándar el año importa poco; cuenta el estado y autenticidad. Los años raros son cosa de numismática."
    }
  ],

  "plata-lingotes": [
    {
      q: "¿Por qué los lingotes de plata tienen prima distinta a las monedas?",
      a: <>Suelen tener <strong>prima por gramo menor</strong>, pero <strong>menos liquidez</strong> en pequeñas unidades. El tamaño típico es <strong>1&nbsp;kg</strong>.</>,
      aText: "Los lingotes de plata suelen tener prima menor pero menos liquidez en unidades pequeñas; 1 kg es el tamaño típico."
    },
    {
      q: "¿Se oxidan o ennegrecen?",
      a: <>La plata puede <strong>tarnish</strong>. Guarda en lugar seco y usa fundas o cápsulas si te preocupa el aspecto.</>,
      aText: "La plata puede oscurecerse con el tiempo; conviene almacenarla en seco y protegida."
    },
    {
      q: "¿Qué marcas son recomendables?",
      a: <>Refinerías reconocidas (Heraeus, Umicore, Metalor, PAMP, Valcambi…). Prioriza <strong>origen fiable</strong> y factura.</>,
      aText: "Marcas reconocidas como Heraeus, Umicore, Metalor, PAMP o Valcambi; prioriza origen fiable y factura."
    },
    {
      q: "¿Cómo comparar bien el precio en plata?",
      a: <>Fíjate en <strong>€/g</strong> y en el <strong>premium</strong>; según el caso, compara contra <em>spot</em> o <em>spot+IVA</em>. Consulta nuestra <InlineLink href="/plata/lingotes">tabla</InlineLink>.</>,
      aText: "Compara €/g y premium; según el caso, contra spot o spot+IVA."
    }
  ],

  "plata-monedas": [
    {
      q: "¿Qué son los ‘milk spots’?",
      a: <>Son <strong>manchas lechosas</strong> superficiales típicas en monedas de plata. No afectan al contenido de metal ni a la autenticidad.</>,
      aText: "Los milk spots son manchas superficiales en monedas de plata; no afectan al metal ni a la autenticidad."
    },
    {
      q: "¿Tubo, cápsula o cartón?",
      a: <>Los <strong>tubos</strong> abaratan el coste por unidad; las <strong>cápsulas</strong> protegen mejor pieza a pieza. Elige según uso y almacenamiento.</>,
      aText: "El tubo abarata la unidad; la cápsula protege mejor cada moneda."
    },
    {
      q: "¿Qué series son más demandadas?",
      a: <>Las bullion clásicas: <strong>Maple</strong>, <strong>Britannia</strong>, <strong>Eagle</strong>, <strong>Filarmónica</strong>, <strong>Kangaroo</strong>. Aportan <strong>liquidez</strong> en recompra.</>,
      aText: "Series bullion demandadas: Maple, Britannia, Eagle, Filarmónica y Kangaroo."
    },
    {
      q: "¿Cómo influye el IVA en monedas de plata?",
      a: <>En España la plata nueva lleva <strong>IVA</strong>. Algunas monedas se venden con <em>régimen especial</em>, lo que puede mejorar el precio final. Revisa el detalle del dealer.</>,
      aText: "La plata nueva lleva IVA; algunas monedas pueden venderse con régimen especial según el dealer."
    }
  ],
  tiendas: [
    {
      q: "¿Qué significa “Tienda verificada”?",
      a: (
        <>
          Revisamos que la web pertenezca al comercio, que opere en España/UE y que
          tenga trayectoria y métodos de pago claros. No es un aval financiero, pero
          sí un filtro editorial básico.
        </>
      ),
      aText:
        "Verificada significa revisión editorial: pertenencia del sitio, operación en España/UE, trayectoria y métodos de pago claros. No es un aval financiero.",
    },
    {
      q: "¿Los precios incluyen envío o comisiones?",
      a: (
        <>
          Mostramos el <strong>precio final del producto</strong> y la{" "}
          <strong>prima s/envío</strong>. El coste de envío y recargos de pago se
          confirman en la tienda antes de finalizar la compra.
        </>
      ),
      aText:
        "Mostramos precio final del producto y prima sin envío. El envío y recargos se confirman en la tienda.",
    },
    {
      q: "¿Cómo se ordenan las ofertas?",
      a: (
        <>
          Priorizamos precio y <em>premium</em> frente al spot. Puedes reordenar y
          filtrar por metal, formato, tamaño o tienda para acotar resultados.
        </>
      ),
      aText:
        "Se priorizan precio y premium frente al spot; se puede filtrar por metal, formato, tamaño o tienda.",
    },
    {
      q: "¿Qué tiendas aparecen?",
      a: (
        <>
          Solo listamos comercios presentes en <strong>/meta/dealers.json</strong>.
          Si falta alguna tienda relevante, puedes sugerirla desde{" "}
          <InlineLink href="/contacto">Contacto</InlineLink>.
        </>
      ),
      aText:
        "Se listan las tiendas incluidas en meta/dealers.json. Se pueden sugerir nuevas en Contacto.",
    },
  ],
};

// Helper para obtener la lista de una sección
export function getFaq(section: string, fallback = "home"): FaqItem[] {
  return faqBySection[section] ?? faqBySection[fallback] ?? [];
}

// JSON-LD para rich results (usa aText —texto plano— si existe)
export function faqToJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: (it.aText ?? "").trim(),
      },
    })),
  };
}
