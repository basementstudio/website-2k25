import { useEffect, useRef, useState } from "react"

import { fetchLaboratory } from "@/actions/laboratory-fetch"
import { useArcadeStore } from "@/store/arcade-store"

import {
  BORDER_RADIUS,
  BORDER_WIDTH,
  COLORS,
  CONTENT_GAP,
  CONTENT_WIDTH,
  FEATURED_HEIGHT,
  HEADER_HEIGHT,
  HEADER_MARGIN_TOP,
  INNER_HEIGHT,
  INNER_PADDING,
  INNER_WIDTH,
  LEFT_WIDTH,
  RIGHT_WIDTH,
  UI_HEIGHT,
  UI_WIDTH,
  WORLD_SCALE
} from "./constants"
import { type FontData, loadMsdfFont, MsdfFontContext } from "./msdf-font"
import { Featured } from "./sections/featured"
import { LabsList } from "./sections/labs-list"
import { Preview } from "./sections/preview"
import { TitleHeader } from "./sections/title-header"
import { WrapperTags } from "./sections/wrapper-tags"
import { UIPanel } from "./ui-panel"

export interface LabTab {
  id: string
  type: "button" | "experiment" | "featured"
  title: string
  url?: string
  isClickable: boolean
}

export const createLabTabs = (experiments: any[]): LabTab[] => {
  return [
    {
      id: "close",
      type: "button",
      title: "CLOSE [ESC]",
      isClickable: true
    },
    ...experiments.map((exp) => ({
      id: `experiment-${exp._title}`,
      type: "experiment" as const,
      title: exp._title.toUpperCase(),
      url: `https://lab.basement.studio/experiments/${exp.url}`,
      isClickable: true
    })),
    {
      id: "view-more",
      type: "button",
      title: "VIEW MORE",
      url: "https://lab.basement.studio/",
      isClickable: true
    },
    {
      id: "chronicles",
      type: "featured",
      title: "CHRONICLES",
      url: "https://chronicles.basement.studio",
      isClickable: true
    },
    {
      id: "looper",
      type: "featured",
      title: "LOOPER (COMING SOON)",
      isClickable: false
    }
  ]
}

interface ArcadeUIProps {
  visible: boolean
}

export const ArcadeUI = ({ visible }: ArcadeUIProps) => {
  const [font, setFont] = useState<FontData | null>(null)
  const [experiments, setExperiments] = useState<any[]>([])
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)
  const loadedRef = useRef(false)

  // Load MSDF font
  useEffect(() => {
    loadMsdfFont("/fonts/ffflauta.json").then(setFont)
  }, [])

  // Fetch experiments when visible
  useEffect(() => {
    if (!visible || loadedRef.current) return
    loadedRef.current = true

    fetchLaboratory().then((data) => {
      const exps = data.projectList.items.map((item: any) => ({
        _title: item._title,
        url: item.url,
        cover: item.cover,
        description: item.description as string | null
      }))
      setExperiments(exps)

      const labTabs = createLabTabs(exps)
      useArcadeStore.getState().setLabTabs(labTabs)
    })
  }, [visible])

  if (!font) return null

  // Coordinate chain: camera [0,0,PI] flips X+Y. Screen shader (uFlip=0) flips
  // the render target Y for WebGPU convention. scale.x = -W un-mirrors X (matching
  // old ScreenUI scale={[-1,1,1]}). scale.y = +W leaves camera Y-flip intact so the
  // shader's second flip produces a correct final image.

  // Inner frame position: centered inside the outer container
  // Outer container is UI_WIDTH x UI_HEIGHT, inner is INNER_WIDTH x INNER_HEIGHT
  // Inner starts at (PADDING_X, PADDING_Y) from outer top-left

  // Content starts inside inner frame, after inner padding
  const contentStartY = INNER_PADDING + HEADER_MARGIN_TOP + HEADER_HEIGHT + INNER_PADDING

  // Available height for content (list + featured)
  const listAreaHeight =
    INNER_HEIGHT - contentStartY - INNER_PADDING - FEATURED_HEIGHT - INNER_PADDING

  return (
    <group visible={visible} scale={[-WORLD_SCALE, WORLD_SCALE, WORLD_SCALE]}>
      <MsdfFontContext.Provider value={font}>
        {/* Outer black background (no border) */}
        <UIPanel
          width={UI_WIDTH}
          height={UI_HEIGHT}
          bgColor={COLORS.black}
          renderOrder={0}
        />

        {/* Inner bordered frame */}
        <UIPanel
          width={INNER_WIDTH}
          height={INNER_HEIGHT}
          bgColor={COLORS.black}
          borderColor={COLORS.primary}
          borderWidth={BORDER_WIDTH}
          radius={BORDER_RADIUS}
          renderOrder={1}
        >
          {/* Content is positioned relative to inner frame top-left */}

          {/* Wrapper tags (absolute positioned) */}
          <WrapperTags
            innerWidth={INNER_WIDTH}
            innerHeight={INNER_HEIGHT}
          />

          {/* Title headers + separator */}
          <TitleHeader
            y={INNER_PADDING + HEADER_MARGIN_TOP}
            contentWidth={CONTENT_WIDTH}
            leftWidth={LEFT_WIDTH}
            paddingX={INNER_PADDING}
          />

          {/* Content area */}
          <group position={[INNER_PADDING, -contentStartY, 0.01]}>
            {/* Left: Experiments list (60%) */}
            <LabsList
              experiments={experiments}
              selectedExperiment={selectedExperiment}
              setSelectedExperiment={setSelectedExperiment}
              width={LEFT_WIDTH}
              height={listAreaHeight}
            />

            {/* Right: Preview (40%) */}
            <group position={[LEFT_WIDTH + CONTENT_GAP, 0, 0]}>
              <Preview
                selectedExperiment={selectedExperiment}
                width={RIGHT_WIDTH}
                height={listAreaHeight}
              />
            </group>
          </group>

          {/* Featured section at bottom */}
          <group
            position={[
              INNER_PADDING,
              -(INNER_HEIGHT - INNER_PADDING - FEATURED_HEIGHT),
              0.01
            ]}
          >
            <Featured
              width={CONTENT_WIDTH}
              height={FEATURED_HEIGHT}
              experiments={experiments}
            />
          </group>
        </UIPanel>
      </MsdfFontContext.Provider>
    </group>
  )
}

export default ArcadeUI
