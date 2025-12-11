// components/AllIndexTable.server.tsx
import AllIndexTable, {
  type AllIndexProps,
  type SpotDoc,
  type Offer,
} from "@/components/AllIndexTable";
import { fetchJsonOrNullServer } from "@/lib/cdn-server";
import type { DealerMeta } from "@/lib/useDealerMeta";

type SkuDoc = { updated_at?: string; updatedAt?: string; offers?: Offer[] };
type IndexDoc = { updated_at?: string; offers?: Offer[] };

export default async function AllIndexTableServer(
  props: Omit<
    AllIndexProps,
    | "dealerMeta"
    | "spotInitial"
    | "offersInitial"
    | "indexUpdatedAtInitial"
  >
) {
  // Dealers: cambian poco → ISR con revalidate
  const dealerMeta =
    (await fetchJsonOrNullServer<DealerMeta>("meta/dealers.json", {
      revalidate: 60 * 60 * 24 * 365, // 1 año
      tags: ["dealers"],
    })) ?? {};

  // Spot: queremos siempre lo último del CDN (sin cache de Next)
  const spot =
    (await fetchJsonOrNullServer<SpotDoc>("meta/spot.json", {
      revalidate: 60, // 60s
      tags: ["spot"],
    })) ?? null;

  let offersInitial: Offer[] = [];
  let indexUpdatedAtInitial: string | null = null;

  if (props.forceSku) {
    // Vista “por SKU” usando la ficha directamente
    const skuDoc =
      (await fetchJsonOrNullServer<SkuDoc>(
        `prices/sku/${props.forceSku}.json`,
        {
          revalidate: 60, // 60s
          tags: [`sku:${props.forceSku}`],
        }
      )) ?? null;

    offersInitial = Array.isArray(skuDoc?.offers) ? skuDoc!.offers : [];
    indexUpdatedAtInitial = skuDoc?.updated_at || skuDoc?.updatedAt || null;
  } else {
    // Tabla general: all_offers del CDN
    const indexDoc =
      (await fetchJsonOrNullServer<IndexDoc>("prices/index/all_offers.json", {
        revalidate: 60, // 60s
        tags: ["all_offers"],
      })) ?? null;

    offersInitial = Array.isArray(indexDoc?.offers) ? indexDoc!.offers : [];
    indexUpdatedAtInitial = indexDoc?.updated_at || null;
  }

  return (
    <AllIndexTable
      dealerMeta={dealerMeta}
      spotInitial={spot}
      offersInitial={offersInitial}
      indexUpdatedAtInitial={indexUpdatedAtInitial}
      {...props}
    />
  );
}
