import { AppHooks } from "../app-hooks-init"
import { AssetsProviderClient } from "."
import { fetchAssets } from "./fetch-assets"

export const AssetsProviderServer = async ({
  children
}: {
  children: React.ReactNode
}) => {
  const assets = await fetchAssets()

  return (
    <AssetsProviderClient assets={assets}>
      {children}
      <AppHooks assets={assets} />
    </AssetsProviderClient>
  )
}
