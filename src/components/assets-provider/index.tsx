"use client"

import { createContext, useContext, useRef } from "react"

import { AssetsResult } from "./fetch-assets"

const AssetContext = createContext<AssetsResult | null>(null)

export function useAssets() {
  const assets = useContext(AssetContext)
  const assetsRef = useRef(assets)
  if (!assets)
    throw new Error("useAssets must be used within an AssetsProvider")

  // avoid re-renders if this changes
  return assetsRef.current!
}

interface AssetsProviderProps {
  children: React.ReactNode
  assets: AssetsResult
}

export const AssetsProviderClient = ({
  children,
  assets
}: AssetsProviderProps) => (
  <AssetContext.Provider value={assets}>{children}</AssetContext.Provider>
)
