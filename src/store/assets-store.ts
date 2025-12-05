import { create } from "zustand"

import { AssetsResult } from "@/components/assets-provider/fetch-assets"

interface AssetsStore {
  assets: AssetsResult | null
}

export const useAssetsStore = create<AssetsStore>((set) => ({
  assets: null
}))
