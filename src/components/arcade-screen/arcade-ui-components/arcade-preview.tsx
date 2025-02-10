import { Container, Text } from "@react-three/uikit"
import React from "react"

import { COLORS_THEME } from "../screen-ui"

export const ArcadePreview = () => {
  return (
    <Container width={"40%"} height={"100%"} gap={10} flexDirection={"column"}>
      <Container
        aspectRatio={16 / 9}
        width={"100%"}
        borderWidth={1.5}
        borderColor={COLORS_THEME.primary}
      ></Container>
      <Text fontSize={10} color={COLORS_THEME.primary}>
        {`Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                    Provident velit officiis beatae amet tempora possimus odit
                    aperiam unde vel`.toUpperCase()}
      </Text>
    </Container>
  )
}
