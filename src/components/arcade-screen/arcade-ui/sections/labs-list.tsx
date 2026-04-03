import { memo, useCallback, useEffect, useMemo, useState } from "react"

import { useKeyPress } from "@/hooks/use-key-press"
import { useCursor } from "@/hooks/use-mouse"
import { useArcadeStore } from "@/store/arcade-store"

import { COLORS, FONT_SIZE_SMALL, LIST_ITEM_HEIGHT } from "../constants"
import { UIPanel } from "../ui-panel"
import { UIText } from "../ui-text"

interface LabsListProps {
  experiments: any[]
  selectedExperiment: any
  setSelectedExperiment: (experiment: any) => void
  width: number
  height: number
}

export const LabsList = ({
  experiments,
  selectedExperiment,
  setSelectedExperiment,
  width,
  height
}: LabsListProps) => {
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const isSourceButtonSelected = useArcadeStore(
    (state) => state.isSourceButtonSelected
  )
  const isInGame = useArcadeStore((state) => state.isInGame)
  const setCursor = useCursor()

  const [mouseHoveredExperiment, setMouseHoveredExperiment] =
    useState<any>(null)
  const [hasMouseInteracted, setHasMouseInteracted] = useState(false)
  const [sourceHoverStates, setSourceHoverStates] = useState<boolean[]>([])

  // Reset source hover states when experiments change
  useEffect(() => {
    setSourceHoverStates(new Array(experiments.length).fill(false))
  }, [experiments.length])

  // Sync selected experiment with keyboard navigation
  useEffect(() => {
    if (isInLabTab && labTabIndex > 0 && labTabIndex <= experiments.length) {
      setSelectedExperiment(experiments[labTabIndex - 1])
      setHasMouseInteracted(false)
    } else {
      setSelectedExperiment(null)
    }
  }, [labTabIndex, isInLabTab, experiments, setSelectedExperiment])

  const handleExperimentClick = useCallback((data: any) => {
    window.open(
      `https://lab.basement.studio/experiments/${data.url}`,
      "_blank"
    )
  }, [])

  // Enter key handler
  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isInLabTab && !isInGame) {
        if (mouseHoveredExperiment) {
          handleExperimentClick(mouseHoveredExperiment)
        } else if (labTabIndex > 0 && labTabIndex <= experiments.length) {
          handleExperimentClick(experiments[labTabIndex - 1])
        }
      }
    }, [
      isInLabTab,
      labTabIndex,
      experiments,
      handleExperimentClick,
      mouseHoveredExperiment,
      isInGame
    ])
  )

  // Scroll calculation (visible items only)
  const scrollStep = LIST_ITEM_HEIGHT
  const totalItems = experiments.length + 1 // +1 for VIEW MORE
  const visibleCount = Math.floor(height / scrollStep)
  const maxScroll = Math.max(0, totalItems * scrollStep - height)

  const scrollOffset = useMemo(() => {
    if (labTabIndex <= 6) return 0
    return Math.min((labTabIndex - 7) * scrollStep, maxScroll)
  }, [labTabIndex, scrollStep, maxScroll])

  const firstVisible = Math.floor(scrollOffset / scrollStep)
  const lastVisible = Math.min(
    totalItems - 1,
    firstVisible + visibleCount + 1
  )

  // Scrollbar
  const scrollbarHeight = Math.max(
    20,
    (height / (totalItems * scrollStep)) * height
  )
  const scrollbarY =
    maxScroll > 0 ? (scrollOffset / maxScroll) * (height - scrollbarHeight) : 0

  return (
    <group>
      {/* List border container */}
      <UIPanel
        width={width}
        height={height}
        position={[width / 2, -height / 2, 0]}
        borderColor={COLORS.primary}
        borderWidth={1}
        bgColor={COLORS.black}
        renderOrder={2}
      />

      {/* Scrollbar */}
      {totalItems * scrollStep > height && (
        <UIPanel
          width={4}
          height={scrollbarHeight}
          position={[
            width - 6,
            -(scrollbarY + scrollbarHeight / 2),
            0.02
          ]}
          bgColor={COLORS.primary}
          renderOrder={4}
        />
      )}

      {/* List items (only render visible) */}
      <group position={[1, 0, 0.01]}>
        {experiments.map((data, idx) => {
          if (idx < firstVisible || idx > lastVisible) return null
          const itemY = idx * scrollStep - scrollOffset
          return (
            <ExperimentItem
              key={idx}
              data={data}
              idx={idx}
              y={itemY}
              width={width - 12} // padding for scrollbar
              isInLabTab={isInLabTab}
              labTabIndex={labTabIndex}
              isSourceButtonSelected={isSourceButtonSelected}
              hasMouseInteracted={hasMouseInteracted}
              mouseHoveredExperiment={mouseHoveredExperiment}
              selectedExperiment={selectedExperiment}
              sourceHoverState={sourceHoverStates[idx]}
              setCursor={setCursor}
              setSelectedExperiment={setSelectedExperiment}
              setMouseHoveredExperiment={setMouseHoveredExperiment}
              setHasMouseInteracted={setHasMouseInteracted}
              setSourceHoverState={(hover: boolean) => {
                setSourceHoverStates((prev) => {
                  const next = [...prev]
                  next[idx] = hover
                  return next
                })
              }}
              onExperimentClick={handleExperimentClick}
            />
          )
        })}

        {/* VIEW MORE button */}
        {experiments.length > 0 && (
          <ViewMore
            y={experiments.length * scrollStep - scrollOffset}
            width={width - 12}
            setSelectedExperiment={setSelectedExperiment}
            visible={
              experiments.length >= firstVisible &&
              experiments.length <= lastVisible
            }
          />
        )}
      </group>
    </group>
  )
}

// --- Experiment Item ---

interface ExperimentItemProps {
  data: any
  idx: number
  y: number
  width: number
  isInLabTab: boolean
  labTabIndex: number
  isSourceButtonSelected: boolean
  hasMouseInteracted: boolean
  mouseHoveredExperiment: any
  selectedExperiment: any
  sourceHoverState: boolean
  setCursor: ReturnType<typeof useCursor>
  setSelectedExperiment: (exp: any) => void
  setMouseHoveredExperiment: (exp: any) => void
  setHasMouseInteracted: (val: boolean) => void
  setSourceHoverState: (hover: boolean) => void
  onExperimentClick: (data: any) => void
}

const ExperimentItem = memo(function ExperimentItem({
  data,
  idx,
  y,
  width,
  isInLabTab,
  labTabIndex,
  isSourceButtonSelected,
  hasMouseInteracted,
  mouseHoveredExperiment,
  selectedExperiment,
  sourceHoverState,
  setCursor,
  setSelectedExperiment,
  setMouseHoveredExperiment,
  setHasMouseInteracted,
  setSourceHoverState,
  onExperimentClick
}: ExperimentItemProps) {
  const isHovered =
    (!hasMouseInteracted &&
      !mouseHoveredExperiment &&
      isInLabTab &&
      labTabIndex === idx + 1 &&
      !isSourceButtonSelected) ||
    (selectedExperiment?._title === data._title &&
      !isSourceButtonSelected &&
      labTabIndex === idx + 1) ||
    mouseHoveredExperiment?._title === data._title

  const isSourceHovered =
    (!hasMouseInteracted &&
      !mouseHoveredExperiment &&
      isInLabTab &&
      labTabIndex === idx + 1 &&
      isSourceButtonSelected) ||
    sourceHoverState

  const highlighted = isHovered || isSourceHovered
  const titleWidth = width * 0.85
  const sourceWidth = width * 0.15

  return (
    <group position={[0, -y, 0]}>
      {/* Row background + border */}
      <UIPanel
        width={width}
        height={LIST_ITEM_HEIGHT}
        position={[width / 2, -LIST_ITEM_HEIGHT / 2, 0]}
        bgColor={highlighted ? COLORS.primary : COLORS.black}
        borderColor={COLORS.primary}
        borderWidth={0}
        renderOrder={3}
        onClick={(e) => {
          e.stopPropagation()
          onExperimentClick(data)
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setCursor("alias")
          setSelectedExperiment(data)
          setMouseHoveredExperiment(data)
          setHasMouseInteracted(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setCursor("default")
          setMouseHoveredExperiment(null)
        }}
      />

      {/* Bottom border line */}
      <UIPanel
        width={width}
        height={1}
        position={[width / 2, -LIST_ITEM_HEIGHT, 0.005]}
        bgColor={COLORS.primary}
        renderOrder={4}
      />

      {/* Title text */}
      <UIText
        text={data._title.toUpperCase()}
        fontSize={FONT_SIZE_SMALL}
        color={highlighted ? COLORS.black : COLORS.primary}
        position={[8, -9, 0.01]}
        renderOrder={5}
      />

      {/* SOURCE button */}
      <group position={[titleWidth, 0, 0.01]}>
        <UIPanel
          width={sourceWidth}
          height={LIST_ITEM_HEIGHT}
          position={[sourceWidth / 2, -LIST_ITEM_HEIGHT / 2, 0]}
          bgColor={isSourceHovered ? COLORS.primary : "transparent"}
          renderOrder={4}
          onClick={(e) => {
            e.stopPropagation()
            window.open(
              `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${data.url}`,
              "_blank"
            )
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            setCursor("alias")
            setSelectedExperiment(data)
            setSourceHoverState(true)
          }}
          onPointerOut={(e) => {
            e.stopPropagation()
            setCursor("default")
            setSourceHoverState(false)
            if (!mouseHoveredExperiment) {
              setSelectedExperiment(null)
            }
          }}
        />
        <UIText
          text="SOURCE"
          fontSize={FONT_SIZE_SMALL}
          color={highlighted ? COLORS.black : COLORS.primary}
          position={[8, -9, 0.02]}
          renderOrder={6}
        />
        {/* Underline on source hover */}
        {isSourceHovered && (
          <UIPanel
            width={45}
            height={2}
            position={[8 + 22.5, -16, 0.02]}
            bgColor={highlighted ? COLORS.black : COLORS.primary}
            renderOrder={6}
          />
        )}
      </group>
    </group>
  )
})

// --- View More Button ---

const ViewMore = ({
  y,
  width,
  setSelectedExperiment,
  visible
}: {
  y: number
  width: number
  setSelectedExperiment: (experiment: any) => void
  visible: boolean
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const labTabIndex = useArcadeStore((state) => state.labTabIndex)
  const isInLabTab = useArcadeStore((state) => state.isInLabTab)
  const labTabs = useArcadeStore((state) => state.labTabs)
  const setCursor = useCursor()

  const handleClick = useCallback(() => {
    window.open("https://lab.basement.studio/", "_blank")
  }, [])

  // VIEW MORE is at labTabs.length - 3 (after all experiments, before featured)
  const isSelected = isInLabTab && labTabIndex === labTabs.length - 3
  const highlighted = isHovered || isSelected

  useKeyPress(
    "Enter",
    useCallback(() => {
      if (isSelected) handleClick()
    }, [isSelected, handleClick])
  )

  if (!visible) return null

  return (
    <group position={[0, -y, 0]}>
      <UIPanel
        width={width}
        height={LIST_ITEM_HEIGHT}
        position={[width / 2, -LIST_ITEM_HEIGHT / 2, 0]}
        bgColor={highlighted ? COLORS.primary : COLORS.black}
        renderOrder={3}
        onClick={() => handleClick()}
        onPointerOver={(e) => {
          e.stopPropagation()
          setCursor("alias")
          setIsHovered(true)
          setSelectedExperiment(null)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          setCursor("default")
          setIsHovered(false)
        }}
      />
      <UIText
        text="VIEW MORE"
        fontSize={FONT_SIZE_SMALL}
        color={highlighted ? COLORS.black : COLORS.primary}
        position={[(width - 70) / 2, -9, 0.01]}
        anchorX="left"
        renderOrder={5}
      />
    </group>
  )
}
