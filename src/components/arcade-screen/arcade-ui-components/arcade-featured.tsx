import { Container, Image, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import React, { useState, useCallback } from "react"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"
import { useKeyPress } from "@/hooks/use-key-press"

import { COLORS_THEME } from "../screen-ui"
import { useArcadeStore } from "@/store/arcade-store"

export const ArcadeFeatured = () => {
  const setCursorType = useMouseStore((state) => state.setCursorType)

  const [hoveredSection, setHoveredSection] = useState({
    chronicles: false,
    looper: false
  })

  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const experiments = useArcadeStore((state) => state.labTabs)

  const isChroniclesSelected =
    isInLabTab && labTabIndex === experiments.length - 2
  const isLooperSelected = isInLabTab && labTabIndex === experiments.length - 1

  const handleChroniclesClick = useCallback(() => {
    window.open("https://chronicles.basement.studio", "_blank")
  }, [])

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isChroniclesSelected) {
        handleChroniclesClick()
      }
    }, [isChroniclesSelected, handleChroniclesClick])
  )

  // Looper is not clickable yet, but we'll keep the structure consistent
  const handleLooperClick = useCallback(() => {
    // Will be implemented when Looper is ready
  }, [])

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isLooperSelected) {
        handleLooperClick()
      }
    }, [isLooperSelected, handleLooperClick])
  )

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
          onClick={handleChroniclesClick}
          onHoverChange={(hover) => {
            if (hover || isChroniclesSelected) {
              setCursorType("alias")
              setHoveredSection((prev) => ({ ...prev, chronicles: true }))
            } else {
              setCursorType("default")
              setHoveredSection((prev) => ({ ...prev, chronicles: false }))
            }
          }}
        >
          <Container
            backgroundColor={
              hoveredSection.chronicles || isChroniclesSelected
                ? COLORS_THEME.primary
                : COLORS_THEME.black
            }
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
              color={
                hoveredSection.chronicles || isChroniclesSelected
                  ? COLORS_THEME.black
                  : COLORS_THEME.primary
              }
              zIndexOffset={10}
              positionTop={4}
            >
              PLAY BASEMENT CHRONICLES
            </Text>
          </Container>
          <Image
            src="/images/arcade-screen/chronicles.png"
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
          onHoverChange={(hover) => {
            if (hover || isLooperSelected) {
              setCursorType("not-allowed")
              setHoveredSection((prev) => ({ ...prev, looper: true }))
            } else {
              setCursorType("default")
              setHoveredSection((prev) => ({ ...prev, looper: false }))
            }
          }}
        >
          <Container
            backgroundColor={
              hoveredSection.looper || isLooperSelected
                ? COLORS_THEME.primary
                : COLORS_THEME.black
            }
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
              color={
                hoveredSection.looper || isLooperSelected
                  ? COLORS_THEME.black
                  : COLORS_THEME.primary
              }
              zIndexOffset={10}
              positionTop={4}
            >
              LOOPER (COOMING SOON)
            </Text>
          </Container>
          <Image
            src="/images/arcade-screen/looper.png"
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
