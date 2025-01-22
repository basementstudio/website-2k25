import { Container, Image, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import React from "react"

import { COLORS_THEME } from "./screen-ui"
import { TextTag } from "./text-tags"

export const GameCovers = () => (
  <Container width="100%" height="35%" paddingTop={16}>
    <Container height={20} width="100%" paddingTop={10} positionType="absolute">
      <Separator
        orientation="horizontal"
        backgroundColor={COLORS_THEME.primary}
        height={3}
      />
      <Container
        positionType="absolute"
        width="100%"
        height={16}
        positionTop={0}
        positionLeft={0}
      >
        <Container width="65%" height="100%" positionType="relative">
          <TextTag text="Arcade" icon />
        </Container>
      </Container>
    </Container>
    <Container
      width="100%"
      height="100%"
      paddingTop={32}
      paddingX={14}
      paddingBottom={16}
    >
      <Container
        width="100%"
        height="100%"
        borderWidth={3}
        borderColor={COLORS_THEME.primary}
      >
        <Container
          width="50%"
          height="100%"
          positionType="relative"
          display="flex"
          justifyContent="center"
          alignItems="center"
          onClick={() => {
            window.open(`https://chronicles.basement.studio/`, "_blank")
          }}
        >
          <Image
            src={`/images/arcade-screen/chronicles.jpg`}
            width="100%"
            height="100%"
            objectFit="cover"
            positionType="absolute"
          />
          <Container
            height={38}
            width="auto"
            backgroundColor={COLORS_THEME.black}
            zIndexOffset={1}
            padding={8}
          >
            <Text fontSize={20} fontWeight="bold" color={COLORS_THEME.primary}>
              Play Basment Chronicles
            </Text>
          </Container>
        </Container>
        <Separator
          orientation="vertical"
          backgroundColor={COLORS_THEME.primary}
          width={3}
        />
        <Container
          width="50%"
          height="100%"
          positionType="relative"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Image
            src={`/images/arcade-screen/looper.jpg`}
            width="100%"
            height="100%"
            objectFit="cover"
            positionType="absolute"
          />
          <Container
            height={38}
            width="auto"
            backgroundColor={COLORS_THEME.black}
            zIndexOffset={1}
            padding={8}
          >
            <Text fontSize={20} fontWeight="bold" color={COLORS_THEME.primary}>
              Looper (coming soon)
            </Text>
          </Container>
        </Container>
      </Container>
    </Container>
  </Container>
)
