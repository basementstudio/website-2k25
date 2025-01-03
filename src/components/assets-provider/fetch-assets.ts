import { basehub } from "basehub"

import { assetsQuery } from "./query"

export interface AssetsResult {
  map: string
  basketball: string
  lightmaps: {
    mesh: string
    url: string
  }[]
  inspectables: {
    id: string
    url: string
  }[]
}

export async function fetchAssets(): Promise<AssetsResult> {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 }
  }).query(assetsQuery)

  return {
    map: threeDInteractions.map?.model?.file?.url ?? "",
    lightmaps: threeDInteractions.map.lightmaps.items.map((item) => ({
      mesh: item._title,
      url: item.exr.url
    })),
    inspectables: threeDInteractions.inspectables.inspectableList.items.map(
      (item) => ({
        id: item._id,
        url: item.model?.file?.url ?? ""
      })
    ),
    basketball:
      threeDInteractions.modelsDb.models.items.find(
        (item) => item._title === "Basketball"
      )?.file?.url ?? ""
  }
}
