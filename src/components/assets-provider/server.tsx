import { Suspense } from "react"

import { AppHooks } from "../app-hooks-init"
import { AssetsProviderClient } from "."
import { fetchAssets } from "./fetch-assets"

export const AssetsProviderServer = ({
  children
}: {
  children: React.ReactNode
}) => {
  return (
    <Suspense fallback={null}>
      <AssetsProviderFetch>{children}</AssetsProviderFetch>
    </Suspense>
  )
}

export const AssetsProviderFetch = async ({
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
