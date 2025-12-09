import { Container, Text } from "@react-three/uikit"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeTitleTagsHeader = () => {
  return (
    <Container
      width={"100%"}
      height={10}
      positionType="relative"
      marginTop={8}
      paddingX={16}
    >
      <Container
        width={"100%"}
        height={1.5}
        backgroundColor={COLORS_THEME.primary}
        positionType="absolute"
        positionLeft={0}
        positionTop={8}
      />
      <Text
        fontSize={11}
        color={COLORS_THEME.primary}
        fontWeight="normal"
        backgroundColor={COLORS_THEME.black}
        positionType="absolute"
        zIndexOffset={10}
        positionTop={2}
        paddingTop={4}
        positionLeft={12}
        paddingX={4}
      >
        EXPERIMENTS
      </Text>
      <Text
        fontSize={11}
        color={COLORS_THEME.primary}
        fontWeight="normal"
        backgroundColor={COLORS_THEME.black}
        positionType="absolute"
        zIndexOffset={10}
        positionTop={2}
        paddingTop={4}
        positionLeft={"60%"}
        paddingX={4}
      >
        PREVIEW
      </Text>
    </Container>
  )
}
