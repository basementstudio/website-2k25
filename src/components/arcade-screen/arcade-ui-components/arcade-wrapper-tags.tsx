import { Text } from "@react-three/uikit"
import { useRouter } from "next/navigation"
import { useCallback } from "react"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useNavigationStore } from "@/components/navigation-handler/navigation-store"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeWrapperTags = () => {
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const { handleNavigation } = useHandleNavigation()
  const setCurrentTabIndex = useNavigationStore(
    (state) => state.setCurrentTabIndex
  )
  const scenes = useNavigationStore((state) => state.scenes)
  const handleClose = useCallback(() => {
    handleNavigation("/")

    const tabIndex = scenes?.[0]?.tabs.findIndex(
      (tab) => tab.tabName.toLowerCase() === "lab"
    )

    setCurrentTabIndex(-1)
  }, [handleNavigation, setCurrentTabIndex, scenes])

  return (
    <>
      <Text
        fontSize={12}
        color={COLORS_THEME.primary}
        fontWeight="normal"
        positionType="absolute"
        positionTop={-3}
        positionLeft={12}
        height={10}
        paddingX={4}
        backgroundColor={COLORS_THEME.black}
        zIndexOffset={10}
        onClick={() => handleClose()}
        onHoverChange={(hover) => {
          if (hover) {
            setCursorType("click")
          } else {
            setCursorType("default")
          }
        }}
      >
        CLOSE [ESC]
      </Text>
      <Text
        fontSize={10}
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
