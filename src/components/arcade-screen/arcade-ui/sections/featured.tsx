import { Suspense, useCallback, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import { useKeyPress } from "@/hooks/use-key-press"
import { useCursor } from "@/hooks/use-mouse"
import { useArcadeStore } from "@/store/arcade-store"

import { COLORS, FONT_SIZE_TINY } from "../constants"
import { UIImage } from "../ui-image"
import { UIPanel } from "../ui-panel"
import { UIText } from "../ui-text"

interface FeaturedProps {
  width: number
  height: number
  experiments: any[]
}

export const Featured = ({ width, height, experiments }: FeaturedProps) => {
  const { arcade } = useAssets()
  const setCursor = useCursor()
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const labTabs = useArcadeStore((state) => state.labTabs)

  const [hoveredSection, setHoveredSection] = useState({
    chronicles: false,
    looper: false
  })

  const isChroniclesSelected = isInLabTab && labTabIndex === labTabs.length - 2
  const isLooperSelected = isInLabTab && labTabIndex === labTabs.length - 1

  const handleChroniclesClick = useCallback(() => {
    window.open("https://chronicles.basement.studio", "_blank")
  }, [])

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isChroniclesSelected) handleChroniclesClick()
    }, [isChroniclesSelected, handleChroniclesClick])
  )

  const halfWidth = (width - 1) / 2 // -1 for separator
  const chroniclesHighlighted =
    hoveredSection.chronicles || isChroniclesSelected
  const looperHighlighted = hoveredSection.looper || isLooperSelected

  return (
    <group>
      {/* Outer border */}
      <UIPanel
        width={width}
        height={height}
        position={[width / 2, -height / 2, 0]}
        borderColor={COLORS.primary}
        borderWidth={1}
        bgColor={COLORS.black}
        renderOrder={2}
      />

      {/* Chronicles section (left half) */}
      <group position={[1, -1, 0.01]}>
        {/* Background image */}
        <Suspense fallback={null}>
          <UIImage
            src={arcade.chronicles}
            width={halfWidth - 1}
            height={height - 2}
            position={[0, 0, 0]}
            renderOrder={3}
          />
        </Suspense>

        {/* Label overlay (centered) */}
        <group position={[(halfWidth - 1) / 2, -(height - 2) / 2, 0.02]}>
          <UIPanel
            width={160}
            height={16}
            bgColor={chroniclesHighlighted ? COLORS.primary : COLORS.black}
            renderOrder={5}
            onClick={() => handleChroniclesClick()}
            onPointerOver={(e) => {
              e.stopPropagation()
              setCursor("alias")
              setHoveredSection((prev) => ({ ...prev, chronicles: true }))
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setCursor("default")
              if (!isChroniclesSelected)
                setHoveredSection((prev) => ({ ...prev, chronicles: false }))
            }}
          >
            <UIText
              text="PLAY BASEMENT CHRONICLES"
              fontSize={FONT_SIZE_TINY}
              color={chroniclesHighlighted ? COLORS.black : COLORS.primary}
              position={[4, -4, 0.01]}
              renderOrder={6}
            />
          </UIPanel>
        </group>
      </group>

      {/* Vertical separator */}
      <UIPanel
        width={1}
        height={height - 2}
        position={[halfWidth + 0.5, -(height / 2), 0.01]}
        bgColor={COLORS.primary}
        renderOrder={3}
      />

      {/* Looper section (right half) */}
      <group position={[halfWidth + 1, -1, 0.01]}>
        {/* Background image */}
        <Suspense fallback={null}>
          <UIImage
            src={arcade.looper}
            width={halfWidth - 1}
            height={height - 2}
            position={[0, 0, 0]}
            renderOrder={3}
          />
        </Suspense>

        {/* Label overlay (centered) */}
        <group position={[(halfWidth - 1) / 2, -(height - 2) / 2, 0.02]}>
          <UIPanel
            width={140}
            height={16}
            bgColor={looperHighlighted ? COLORS.primary : COLORS.black}
            renderOrder={5}
            onPointerOver={(e) => {
              e.stopPropagation()
              setCursor("not-allowed")
              setHoveredSection((prev) => ({ ...prev, looper: true }))
            }}
            onPointerOut={(e) => {
              e.stopPropagation()
              setCursor("default")
              if (!isLooperSelected)
                setHoveredSection((prev) => ({ ...prev, looper: false }))
            }}
          >
            <UIText
              text="LOOPER (COMING SOON)"
              fontSize={FONT_SIZE_TINY}
              color={looperHighlighted ? COLORS.black : COLORS.primary}
              position={[4, -4, 0.01]}
              renderOrder={6}
            />
          </UIPanel>
        </group>
      </group>
    </group>
  )
}
