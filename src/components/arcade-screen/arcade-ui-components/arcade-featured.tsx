import { Container, Image, Text } from "@react-three/uikit"
import { Separator } from "@react-three/uikit-default"
import React, { useCallback, useState } from "react"

import { useAssets } from "@/components/assets-provider/use-assets"
import { useKeyPress } from "@/hooks/use-key-press"
import { useCursor } from "@/hooks/use-mouse"
import { useArcadeStore } from "@/store/arcade-store"

import { COLORS_THEME } from "../screen-ui"

export const ArcadeFeatured = () => {
  const assets = useAssets()

  const [hoveredSection, setHoveredSection] = useState({
    chronicles: false,
    looper: false
  })

  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const experiments = useArcadeStore((state) => state.labTabs)
  const setCursor = useCursor()
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

  const handleLooperClick = useCallback(() => {
    //TODO: ADD LOOPER
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
        padding={1}
      >
        <Container
          width={"50%"}
          height={"100%"}
          positionType="relative"
          alignItems="center"
          justifyContent="center"
          onClick={(e) => {
            // if (e) {
            //   e.stopPropagation()
            // }
            handleChroniclesClick()
          }}
          onHoverChange={(hover) => {
            if (hover || isChroniclesSelected) {
              setCursor("alias")
              setHoveredSection((prev) => ({ ...prev, chronicles: true }))
            } else {
              setCursor("default")
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
            {...({ zIndex: 10 } as any)}
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
            src={assets?.arcade?.chronicles ?? ""}
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
              setCursor("not-allowed")
              setHoveredSection((prev) => ({ ...prev, looper: true }))
            } else {
              setCursor("default")
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
            {...({ zIndex: 10 } as any)}
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
            src={assets?.arcade?.looper ?? ""}
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
