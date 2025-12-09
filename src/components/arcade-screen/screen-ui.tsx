import { Container } from "@react-three/uikit"
import { useEffect, useMemo, useRef, useState } from "react"

import { fetchLaboratory } from "@/actions/laboratory-fetch"
import { useArcadeStore } from "@/store/arcade-store"

import { ArcadeFeatured } from "./arcade-ui-components/arcade-featured"
import { ArcadeLabsList } from "./arcade-ui-components/arcade-labs-list"
import { ArcadePreview } from "./arcade-ui-components/arcade-preview"
import { ArcadeTitleTagsHeader } from "./arcade-ui-components/arcade-title-tags-header"
import { ArcadeWrapperTags } from "./arcade-ui-components/arcade-wrapper-tags"

interface ScreenUIProps {
  onLoad?: () => void
  visible: boolean
}

export const COLORS_THEME = {
  primary: "#FF4D00",
  black: "#000"
}

export interface LabTab {
  id: string
  type: "button" | "experiment" | "featured"
  title: string
  url?: string
  isClickable: boolean
}

export const createLabTabs = (experiments: any[]): LabTab[] => {
  const tabs: LabTab[] = [
    // Close button
    {
      id: "close",
      type: "button",
      title: "CLOSE [ESC]",
      isClickable: true
    },

    // Experiments
    ...experiments.map((exp) => ({
      id: `experiment-${exp._title}`,
      type: "experiment" as const,
      title: exp._title.toUpperCase(),
      url: `https://lab.basement.studio/experiments/${exp.url}`,
      isClickable: true
    })),

    // View More button
    {
      id: "view-more",
      type: "button",
      title: "VIEW MORE",
      url: "https://lab.basement.studio/",
      isClickable: true
    },

    // Chronicles
    {
      id: "chronicles",
      type: "featured",
      title: "CHRONICLES",
      url: "https://chronicles.basement.studio",
      isClickable: true
    },

    // Looper
    {
      id: "looper",
      type: "featured",
      title: "LOOPER (COMING SOON)",
      isClickable: false
    }
  ]

  return tabs
}

export const ScreenUI = ({ onLoad, visible }: ScreenUIProps) => {
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad

  const [experiments, setExperiments] = useState<any[]>([])
  const [selectedExperiment, setSelectedExperiment] = useState<any>(null)

  // Font URL for react-three/uikit
  const fontFamilies = useMemo(
    () => ({
      ffflauta: {
        normal: "/fonts/ffflauta.json"
      }
    }),
    []
  )

  useEffect(() => {
    if (visible) {
      fetchLaboratory().then((data) => {
        const experiments = data.projectList.items.map((item: any) => ({
          _title: item._title,
          url: item.url,
          cover: item.cover,
          description: item.description as string | null
        }))
        setExperiments(experiments)

        const labTabs = createLabTabs(experiments)
        useArcadeStore.getState().setLabTabs(labTabs)

        onLoadRef.current?.()
      })
    }
  }, [visible])

  return (
    <group visible={visible} scale={[-1, 1, 1]}>
      <Container
        width={590}
        height={390}
        backgroundColor={COLORS_THEME.black}
        positionType="relative"
        display="flex"
        flexDirection="column"
        paddingY={24}
        paddingX={18}
        {...({
          fontFamilies,
          "*": {
            fontFamily: "ffflauta",
            fontSize: 13,
            fontWeight: "normal",
            color: COLORS_THEME.primary
          }
        } as any)}
      >
        <Container
          width={"100%"}
          height={"100%"}
          borderWidth={1.5}
          borderColor={COLORS_THEME.primary}
          borderRadius={10}
          paddingY={10}
          paddingX={1.5}
          flexDirection="column"
        >
          <ArcadeWrapperTags />
          <ArcadeTitleTagsHeader />
          <Container
            width={"100%"}
            flexGrow={1}
            zIndexOffset={16}
            padding={10}
            flexDirection="row"
            gap={10}
          >
            <ArcadeLabsList
              experiments={experiments}
              selectedExperiment={selectedExperiment}
              setSelectedExperiment={setSelectedExperiment}
            />
            <ArcadePreview selectedExperiment={selectedExperiment} />
          </Container>
          <ArcadeFeatured />
        </Container>
      </Container>
    </group>
  )
}
