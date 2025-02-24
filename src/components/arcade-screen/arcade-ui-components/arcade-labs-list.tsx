import { Container, Text } from "@react-three/uikit"

import { useMouseStore } from "@/components/mouse-tracker/mouse-tracker"

import { COLORS_THEME } from "../screen-ui"
import { useState, useEffect, useRef, useCallback } from "react"
import { useArcadeStore } from "@/store/arcade-store"
import { useKeyPress } from "@/hooks/use-key-press"

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
  const scrollContainerRef = useRef<any>(null)
  const [sourceHoverStates, setSourceHoverStates] = useState<boolean[]>(
    new Array(experiments.length).fill(false)
  )

  const handleExperimentClick = useCallback((data: any) => {
    window.open(`https://lab.basement.studio/experiments/${data.url}`, "_blank")
  }, [])

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isInLabTab && labTabIndex > 0 && labTabIndex <= experiments.length) {
        handleExperimentClick(experiments[labTabIndex - 1])
      }
    }, [isInLabTab, labTabIndex, experiments, handleExperimentClick])
  )

  useEffect(() => {
    if (isInLabTab && labTabIndex > 0 && labTabIndex <= experiments.length) {
      setSelectedExperiment(experiments[labTabIndex - 1])
    } else {
      setSelectedExperiment(null)
    }
  }, [labTabIndex, isInLabTab, experiments, setSelectedExperiment])

  useEffect(() => {
    if (scrollContainerRef.current && labTabIndex >= 7) {
      const scrollStep = 24
      const maxScroll = 277
      const scrollOffset = (labTabIndex - 7) * scrollStep

      const newScroll =
        scrollOffset <= 0 ? 0 : Math.min(scrollOffset, maxScroll)

      if (scrollContainerRef.current.scrollPosition.value) {
        scrollContainerRef.current.scrollPosition.value = [0, newScroll]
      } else {
        scrollContainerRef.current.scrollPosition.v = [0, newScroll]
      }

      scrollContainerRef.current.forceUpdate?.()
    }
  }, [labTabIndex])

  return (
    <Container
      ref={scrollContainerRef}
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
              height={24}
              borderBottomWidth={1}
              borderRightWidth={1}
              borderColor={COLORS_THEME.primary}
              alignItems="center"
            >
              <Container
                marginLeft={1}
                paddingTop={9}
                paddingX={8}
                width={"85%"}
                backgroundColor={
                  isHovered ? COLORS_THEME.primary : COLORS_THEME.black
                }
                onHoverChange={(hover) => {
                  if (hover) {
                    setCursorType("alias")
                    setSelectedExperiment(data)
                  } else {
                    setCursorType("default")
                  }
                }}
              >
                <Text
                  fontSize={10}
                  zIndexOffset={10}
                  color={isHovered ? COLORS_THEME.black : COLORS_THEME.primary}
                >
                  {data._title.toUpperCase()}
                </Text>
              </Container>
              <Container
                paddingTop={9}
                paddingX={8}
                positionType="relative"
                onClick={(e) => {
                  e.stopPropagation()
                  window.open(
                    `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${data.url}`,
                    "_blank"
                  )
                }}
                onHoverChange={(hover) => {
                  if (hover) {
                    setCursorType("alias")
                    setSourceHoverStates((prev) => {
                      const newStates = [...prev]
                      newStates[idx] = true
                      return newStates
                    })
                  } else {
                    setCursorType("default")
                    setSourceHoverStates((prev) => {
                      const newStates = [...prev]
                      newStates[idx] = false
                      return newStates
                    })
                  }
                }}
              >
                <Text fontSize={10} zIndexOffset={10}>
                  SOURCE
                </Text>
                <Container
                  width={45}
                  height={1}
                  positionTop={16}
                  positionType="absolute"
                  backgroundColor={COLORS_THEME.primary}
                  visibility={sourceHoverStates[idx] ? "visible" : "hidden"}
                />
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

  const handleViewMoreClick = useCallback(() => {
    window.open("https://basement.studio/lab", "_blank")
  }, [])

  const isSelected = isInLabTab && labTabIndex === experiments.length - 3

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isSelected) {
        handleViewMoreClick()
      }
    }, [isSelected, handleViewMoreClick])
  )

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
      onClick={handleViewMoreClick}
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
