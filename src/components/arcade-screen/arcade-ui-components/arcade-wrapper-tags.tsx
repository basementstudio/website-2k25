import { Text } from "@react-three/uikit"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeWrapperTags = () => {
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
      >
        CLOSE
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
