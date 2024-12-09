import { basehub } from "basehub";
import { assetsQuery } from "./query";

export interface AssetsResult {
  map: string;
  inspectables: string[];
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 },
  }).query(assetsQuery);

  return {
    map: threeDInteractions.map?.file?.url ?? "",
    inspectables: threeDInteractions.inspectables.inspectableList.items.map(
      (item) => item.model?.file?.url ?? "",
    ),
  };
}
