import { Container, Text } from "@react-three/uikit"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

import { COLORS_THEME } from "../screen-ui"
import { useState, useEffect } from "react"
import { useArcadeStore } from "@/store/arcade-store"

interface ArcadeLabsListProps {
  experiments: any[]
  selectedExperiment: any
  setSelectedExperiment: (experiment: any) => void
}

export const ArcadeLabsList = ({
  experiments,
  selectedExperiment,
  setSelectedExperiment
}: ArcadeLabsListProps) => {
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)

  useEffect(() => {
    if (isInLabTab && labTabIndex > 0 && labTabIndex <= experiments.length) {
      setSelectedExperiment(experiments[labTabIndex - 1])
    } else {
      setSelectedExperiment(null)
    }
  }, [labTabIndex, isInLabTab, experiments, setSelectedExperiment])

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
      onHoverChange={(hover) => {
        if (!hover) {
          setSelectedExperiment(null)
        }
      }}
    >
      {experiments &&
        experiments.map((data, idx) => {
          const isHovered =
            (isInLabTab && labTabIndex === idx + 1) ||
            (selectedExperiment && selectedExperiment._title === data._title)

          return (
            <Container
              key={idx}
              flexDirection="row"
              justifyContent="space-between"
              width={"100%"}
              paddingLeft={8}
              paddingRight={8}
              height={24}
              borderBottomWidth={1}
              borderRightWidth={1}
              backgroundColor={
                isHovered ? COLORS_THEME.primary : COLORS_THEME.black
              }
              borderColor={COLORS_THEME.primary}
              paddingTop={8}
              onHoverChange={(hover) => {
                if (hover) {
                  setCursorType("alias")
                  setSelectedExperiment(data)
                } else {
                  setCursorType("default")
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
                window.open(
                  `https://lab.basement.studio/experiments/${data.url}`,
                  "_blank"
                )
              }}
            >
              <Text
                fontSize={10}
                color={isHovered ? COLORS_THEME.black : COLORS_THEME.primary}
                fontWeight="normal"
                zIndexOffset={10}
              >
                {data._title.toUpperCase()}
              </Text>
              <Container width={"auto"} gap={8}>
                <Text
                  fontSize={9}
                  color={isHovered ? COLORS_THEME.black : COLORS_THEME.primary}
                  fontWeight="normal"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(
                      `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${data.url}`,
                      "_blank"
                    )
                  }}
                >
                  CODE
                </Text>
                <Text
                  fontSize={9}
                  color={isHovered ? COLORS_THEME.black : COLORS_THEME.primary}
                  fontWeight="normal"
                  onClick={(e) => {
                    e.stopPropagation()
                    window.open(
                      `https://lab.basement.studio/experiments/${data.url}`,
                      "_blank"
                    )
                  }}
                >
                  LIVE
                </Text>
              </Container>
            </Container>
          )
        })}
      <ViewMore
        isLoaded={experiments.length > 0}
        setSelectedExperiment={setSelectedExperiment}
      />
    </Container>
  )
}

const ViewMore = ({
  isLoaded,
  setSelectedExperiment
}: {
  isLoaded: boolean
  setSelectedExperiment: (experiment: any) => void
}) => {
  const [isViewMoreHovered, setIsViewMoreHovered] = useState(false)
  const setCursorType = useMouseStore((state) => state.setCursorType)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const experiments = useArcadeStore((state) => state.labTabs)

  const isSelected = isInLabTab && labTabIndex === experiments.length - 3

  if (!isLoaded) return null
  return (
    <Container
      flexDirection="row"
      justifyContent="center"
      width={"100%"}
      paddingLeft={8}
      paddingRight={8}
      height={24}
      borderBottomWidth={0}
      borderRightWidth={1}
      backgroundColor={
        isViewMoreHovered || isSelected
          ? COLORS_THEME.primary
          : COLORS_THEME.black
      }
      borderColor={COLORS_THEME.primary}
      paddingTop={8}
      onClick={() => {
        window.open("https://basement.studio/lab", "_blank")
      }}
      onHoverChange={(hover) => {
        if (hover) {
          setSelectedExperiment(null)
          setIsViewMoreHovered(true)
          setCursorType("alias")
        } else {
          setSelectedExperiment(null)
          setIsViewMoreHovered(false)
          setCursorType("default")
        }
      }}
    >
      <Text
        fontSize={10}
        color={
          isViewMoreHovered || isSelected
            ? COLORS_THEME.black
            : COLORS_THEME.primary
        }
        fontWeight="normal"
        zIndexOffset={10}
      >
        VIEW MORE
      </Text>
    </Container>
  )
}
