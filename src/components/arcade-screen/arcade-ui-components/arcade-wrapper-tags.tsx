import { Container, Text } from "@react-three/uikit"
import { useCallback, useEffect, useState } from "react"

import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useKeyPress } from "@/hooks/use-key-press"

import { COLORS_THEME } from "../screen-ui"
import { useArcadeStore } from "@/store/arcade-store"
import { useCursor } from "@/hooks/use-mouse"

export const ArcadeWrapperTags = () => {
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

  return (
    <>
      <Container
        positionType="absolute"
        positionTop={-8}
        positionLeft={10}
        backgroundColor={hoverClose ? COLORS_THEME.primary : COLORS_THEME.black}
        height={16}
        paddingX={0}
        zIndexOffset={10}
        onClick={() => handleClose()}
        onHoverChange={(hover) => {
          if (hover) {
            setCursor("pointer")
            setHoverClose(true)
          } else {
            setCursor("default")
            setHoverClose(false)
          }
        }}
      >
        <Text
          fontSize={10}
          color={hoverClose ? COLORS_THEME.black : COLORS_THEME.primary}
          positionTop={4}
          fontWeight="normal"
          height={16}
          paddingX={4}
          zIndexOffset={10}
        >
          CLOSE [ESC]
        </Text>
      </Container>
      <Text
        fontSize={9}
        color={COLORS_THEME.primary}
        fontWeight="normal"
        positionType="absolute"
        positionBottom={-10}
        positionRight={12}
        paddingX={4}
        backgroundColor={COLORS_THEME.black}
        zIndexOffset={10}
      >
        LABS V1.0
      </Text>
    </>
  )
}
