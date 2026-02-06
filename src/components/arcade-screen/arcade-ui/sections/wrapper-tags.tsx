import { useCallback, useEffect, useState } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"
import { useCursor } from "@/hooks/use-mouse"
import { useArcadeStore } from "@/store/arcade-store"

import { COLORS, FONT_SIZE_LABEL, FONT_SIZE_SMALL } from "../constants"
import { UIPanel } from "../ui-panel"
import { UIText } from "../ui-text"

interface WrapperTagsProps {
  innerWidth: number
  innerHeight: number
}

export const WrapperTags = ({ innerWidth, innerHeight }: WrapperTagsProps) => {
  const { handleNavigation } = useHandleNavigation()
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )
  const setCursor = useCursor()

  const handleClose = useCallback(() => {
    handleNavigation("/")
    setCurrentTabIndex(-1)
  }, [handleNavigation, setCurrentTabIndex])

  const [hoverClose, setHoverClose] = useState(false)

  // Auto-highlight when navigated to via stick/keyboard
  useEffect(() => {
    if (isInLabTab && labTabIndex === 0) {
      setHoverClose(true)
    } else {
      setHoverClose(false)
    }
  }, [isInLabTab, labTabIndex])

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isInLabTab && labTabIndex === 0) {
        handleClose()
      }
    }, [isInLabTab, labTabIndex, handleClose])
  )

  const isHighlighted = hoverClose || (isInLabTab && labTabIndex === 0)

  return (
    <>
      {/* CLOSE [ESC] button — positioned above top edge */}
      <group position={[10, 8, 0.02]}>
        <UIPanel
          width={80}
          height={16}
          bgColor={isHighlighted ? COLORS.primary : COLORS.black}
          renderOrder={10}
          onClick={() => handleClose()}
          onPointerOver={(e) => {
            e.stopPropagation()
            setCursor("pointer")
            setHoverClose(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setCursor("default")
            if (!(isInLabTab && labTabIndex === 0)) {
              setHoverClose(false)
            }
          }}
        >
          <UIText
            text="CLOSE [ESC]"
            fontSize={FONT_SIZE_SMALL}
            color={isHighlighted ? COLORS.black : COLORS.primary}
            position={[4, -4, 0.01]}
            renderOrder={11}
          />
        </UIPanel>
      </group>

      {/* LABS V1.0 label — positioned below bottom edge */}
      <group position={[innerWidth - 70, -(innerHeight + 2), 0.02]}>
        <UIPanel
          width={54}
          height={14}
          bgColor={COLORS.black}
          renderOrder={10}
        >
          <UIText
            text="LABS V1.0"
            fontSize={FONT_SIZE_LABEL}
            color={COLORS.primary}
            position={[4, -4, 0.01]}
            renderOrder={11}
          />
        </UIPanel>
      </group>
    </>
  )
}
