import { useAssetsStore } from "@/store/assets-store"

export const useAssets = () => {
  const assets = useAssetsStore((s) => s.assets)

  return assets
}
