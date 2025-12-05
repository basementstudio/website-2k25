import { fetchAssets } from "@/components/assets-provider/fetch-assets"

import { AppHooksClient } from "./app-hooks-init.client"

export const AppHooks = async () => {
  const assets = await fetchAssets()

  return <AppHooksClient assets={assets} />
}
