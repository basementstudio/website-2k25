import { basehub } from "basehub";
import { assetsQuery } from "./query";

export interface AssetsResult {
  map: string;
  inspectables: {
    id: string;
    url: string;
  }[];
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 },
  }).query(assetsQuery);

  return {
    map: threeDInteractions.map?.file?.url ?? "",
    inspectables: threeDInteractions.inspectables.inspectableList.items.map(
      (item) => ({
        id: item._id,
        url: item.model?.file?.url ?? "",
      }),
    ),
  };
}
