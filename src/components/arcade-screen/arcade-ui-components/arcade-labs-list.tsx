import { Container, Text } from "@react-three/uikit"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeLabsList = () => {
  return (
    <Container
      width={"60%"}
      height={"100%"}
      borderWidth={1}
      borderColor={COLORS_THEME.primary}
      overflow="scroll"
      alignItems="flex-start"
      justifyContent="flex-start"
      flexDirection="column"
      paddingRight={10}
      scrollbarBorderColor={COLORS_THEME.black}
      scrollbarBorderWidth={2}
      scrollbarColor={COLORS_THEME.primary}
    >
      {Array.from({ length: 24 }).map((_, index) => (
        <Container
          key={index}
          flexDirection="row"
          justifyContent="space-between"
          width={"100%"}
          paddingLeft={8}
          paddingRight={8}
          height={24}
          borderBottomWidth={1}
          borderRightWidth={1}
          borderColor={COLORS_THEME.primary}
          paddingTop={8}
        >
          <Text fontSize={10} color={COLORS_THEME.primary} fontWeight="normal">
            {"Multi scene composer pipeline.".toUpperCase()}
          </Text>
          <Container width={"auto"} gap={8}>
            <Text fontSize={9} color={COLORS_THEME.primary} fontWeight="normal">
              CODE
            </Text>
            <Text fontSize={9} color={COLORS_THEME.primary} fontWeight="normal">
              LIVE
            </Text>
          </Container>
        </Container>
      ))}
    </Container>
  )
}
