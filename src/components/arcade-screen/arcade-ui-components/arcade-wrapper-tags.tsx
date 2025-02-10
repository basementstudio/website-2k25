import { Text } from "@react-three/uikit"
import { useRouter } from "next/navigation"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeWrapperTags = () => {
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const router = useRouter()
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
        onClick={() => {
          router.prefetch("/")
          router.push("/")
        }}
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
