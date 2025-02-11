import { Container, Image, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import React from "react"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeFeatured = () => {
  const setCursorType = useMouseStore((state) => state.setCursorType)
  return (
    <Container paddingX={10} width={"100%"} height={100}>
      <Container
        width={"100%"}
        height={"100%"}
        borderWidth={1}
        borderColor={COLORS_THEME.primary}
        flexDirection="row"
      >
        <Container
          width={"50%"}
          height={"100%"}
          positionType="relative"
          alignItems="center"
          justifyContent="center"
          onClick={(e) => {
            e.stopPropagation()
            window.open(`https://chronicles.basement.studio/`, "_blank")
          }}
          onHoverChange={(hover) => {
            if (hover) {
              setCursorType("click")
            } else {
              setCursorType("default")
            }
          }}
        >
          <Container
            backgroundColor={COLORS_THEME.black}
            positionType="absolute"
            width={"auto"}
            zIndexOffset={10}
            height={16}
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize={8}
              paddingX={4}
              color={COLORS_THEME.primary}
              zIndexOffset={10}
              positionTop={4}
            >
              PLAY BASEMENT CHRONICLES
            </Text>
          </Container>
          <Image
            src="/images/arcade-screen/chronicles.jpg"
            width={"100%"}
            height={"100%"}
            objectFit="cover"
            positionType="absolute"
          />
        </Container>
        <Separator
          width={1}
          backgroundColor={COLORS_THEME.primary}
          orientation="vertical"
        />
        <Container
          width={"50%"}
          height={"100%"}
          positionType="relative"
          alignItems="center"
          justifyContent="center"
        >
          <Container
            backgroundColor={COLORS_THEME.black}
            positionType="absolute"
            width={"auto"}
            zIndexOffset={10}
            height={16}
            alignItems="center"
            justifyContent="center"
          >
            <Text
              fontSize={8}
              paddingX={4}
              color={COLORS_THEME.primary}
              zIndexOffset={10}
              positionTop={4}
            >
              LOOPER (COOMING SOON)
            </Text>
          </Container>
          <Image
            src="/images/arcade-screen/looper.jpg"
            width={"100%"}
            height={"100%"}
            objectFit="cover"
            positionType="absolute"
          />
        </Container>
      </Container>
    </Container>
  )
}
