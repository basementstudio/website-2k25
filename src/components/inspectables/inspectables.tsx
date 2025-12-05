"use client"

import { memo, useEffect } from "react"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useCurrentScene } from "@/hooks/use-current-scene"
import { useSiteAudio } from "@/hooks/use-site-audio"

import { useInspectable } from "./context"
import { Inspectable } from "./inspectable"

export const Inspectables = memo(function InspectablesInner() {
  const { selected, setSelected } = useInspectable()
  const assets = useAssets()
  const scene = useCurrentScene()
  const { playInspectableFX } = useSiteAudio()

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) setSelected(null)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [setSelected])

  useEffect(() => {
    if (selected) {
      const inspectableFx = assets?.inspectables.find(
        (i) => i.mesh === selected
      )?.fx

      if (inspectableFx) {
        playInspectableFX(inspectableFx, 0.65)
      }
    }
  }, [selected, assets?.inspectables, playInspectableFX])

  useEffect(() => setSelected(null), [scene, setSelected])

  return (
    <>
      {assets?.inspectables.map((inspectableConfig) => (
        <Inspectable key={inspectableConfig.mesh} id={inspectableConfig.mesh} />
      ))}
    </>
  )
})
