"use client"

import { createContext, useContext } from "react"

import { AssetsResult } from "./fetch-assets"

const AssetContext = createContext<AssetsResult | null>(null)

export function useAssets() {
  const assets = useContext(AssetContext)
  if (!assets)
    throw new Error("useAssets must be used within an AssetsProvider")
  return assets
}

interface AssetsProviderProps {
  children: React.ReactNode
  assets: AssetsResult
}

export const AssetsProvider = ({ children, assets }: AssetsProviderProps) => (
  <AssetContext.Provider value={assets}>{children}</AssetContext.Provider>
)
