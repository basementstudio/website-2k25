import { Container, Image, Text } from "@react-three/uikit"
import React from "react"

import { COLORS_THEME } from "../screen-ui"

interface ArcadePreviewProps {
  selectedExperiment: any
}

export const ArcadePreview = ({ selectedExperiment }: ArcadePreviewProps) => {
  console.log(selectedExperiment)
  return (
    <Container width={"40%"} height={"100%"} gap={10} flexDirection={"column"}>
      <Container
        aspectRatio={16 / 9}
        width={"100%"}
        borderWidth={1.5}
        borderColor={COLORS_THEME.primary}
        positionType="relative"
      >
        {selectedExperiment && (
          <Image
            positionType="absolute"
            src={selectedExperiment.cover.url}
            width={"100%"}
            height={"100%"}
            objectFit="cover"
          />
        )}
      </Container>
      <Text fontSize={10} color={COLORS_THEME.primary}>
        {selectedExperiment && selectedExperiment.description.toUpperCase()}
      </Text>
    </Container>
  )
}
