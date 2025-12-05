"use client"

import { useEffect } from "react"

import { useAssetsStore } from "@/store/assets-store"

import { AssetsResult } from "./fetch-assets"

export const AssetsStoreInitializer = ({
  assets
}: {
  assets: AssetsResult
}) => {
  useEffect(() => {
    useAssetsStore.setState({ assets })
  }, [assets])

  return null
}
