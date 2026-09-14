import { useThree } from "@react-three/fiber"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { fetchLaboratory } from "@/actions/laboratory-fetch"
import { useAssets } from "@/components/assets-provider"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { createCanvasTexture } from "@/lib/graphics/canvas-texture"
import { useArcadeStore } from "@/store/arcade-store"

import { type ArcadeBitmapFont, loadArcadeBitmapFont } from "./bitmap-font"

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

export interface Experiment {
  _title: string
  url: string
  cover: { url: string } | null
  description: string | null
}

export const createLabTabs = (experiments: Experiment[]): LabTab[] => {
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
      title: "LOOPER",
      url: "https://looper.basement.studio/",
      isClickable: true
    },

    // Shader Lab
    {
      id: "shaderlab",
      type: "featured",
      title: "SHADER LAB",
      url: "https://eng.basement.studio/tools/shader-lab",
      isClickable: true
    }
  ]

  return tabs
}

type Hit = {
  x: number
  y: number
  width: number
  height: number
  index: number
  source?: boolean
}
export const ScreenUI = ({ onLoad, visible }: ScreenUIProps) => {
  const { texture, context: ctx } = useMemo(
    () => createCanvasTexture(1180, 780),
    []
  )
  const invalidate = useThree((s) => s.invalidate)
  const { handleNavigation } = useHandleNavigation()
  const [experiments, setExperiments] = useState<Experiment[]>([])
  const [fontReady, setFontReady] = useState(false)
  const font = useRef<ArcadeBitmapFont | null>(null)
  const [dataReady, setDataReady] = useState(false)
  const [scroll, setScroll] = useState(0)
  const [hovered, setHovered] = useState<Hit | null>(null)
  const keyboardSelected = useArcadeStore((s) => s.isInLabTab)
  const [error, setError] = useState(false)
  const sourceSelected = useArcadeStore((state) => state.isSourceButtonSelected)
  const selected = useArcadeStore((s) => s.labTabIndex)
  const tabs = useMemo(() => createLabTabs(experiments), [experiments])
  const hits = useRef<Hit[]>([])
  const assets = useAssets()
  const images = useRef(new Map<string, HTMLImageElement>())
  const [imageRevision, setImageRevision] = useState(0)
  const onLoadRef = useRef(onLoad)
  onLoadRef.current = onLoad
  useEffect(() => {
    loadArcadeBitmapFont()
      .then((loaded) => {
        font.current = loaded
        setFontReady(true)
      })
      .catch(() => setFontReady(true))
    return () => texture.dispose()
  }, [texture])
  useEffect(() => {
    if (!visible || experiments.length) return
    let canceled = false
    fetchLaboratory()
      .then((items) => {
        if (!canceled) {
          setExperiments(
            items.map((item) => ({
              _title: item.title,
              url: item.url,
              cover: item.cover,
              description: item.description
            }))
          )
          setDataReady(true)
        }
      })
      .catch(() => {
        if (!canceled) {
          setError(true)
          setDataReady(true)
        }
      })
    return () => {
      canceled = true
    }
  }, [visible, experiments.length])
  useEffect(() => {
    useArcadeStore.getState().setLabTabs(tabs)
  }, [tabs])
  const maxScroll = Math.max(0, (experiments.length + 1) * 24 - 181)
  useEffect(() => {
    if (!keyboardSelected || selected <= 0 || selected > experiments.length + 1)
      return
    setHovered(null)
    const top = (selected - 1) * 24
    setScroll((current) =>
      Math.min(
        maxScroll,
        Math.max(
          0,
          top < current
            ? top
            : top + 24 > current + 181
              ? top + 24 - 181
              : current
        )
      )
    )
  }, [selected, keyboardSelected, experiments.length, maxScroll])
  const activate = useCallback(
    (index: number, source = false) => {
      const tab = tabs[index]
      if (!tab) return
      if (source && tab.type === "experiment") {
        const experiment = experiments[index - 1]
        window.open(
          `https://github.com/basementstudio/basement-laboratory/tree/main/src/experiments/${experiment.url}`,
          "_blank",
          "noopener,noreferrer"
        )
      } else if (index === 0) handleNavigation("/")
      else if (tab.url) window.open(tab.url, "_blank", "noopener,noreferrer")
    },
    [tabs, experiments, handleNavigation]
  )
  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === "Enter" && useArcadeStore.getState().isInLabTab)
        activate(
          useArcadeStore.getState().labTabIndex,
          useArcadeStore.getState().isSourceButtonSelected
        )
      if (event.code === "Escape") handleNavigation("/")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [visible, activate, handleNavigation])
  useEffect(() => {
    // Match the original 590 × 390 UIKit layout in screen coordinates.
    const orange = COLORS_THEME.primary
    const measure = (text: string, size: number) =>
      font.current?.measure(text, size) ?? ctx.measureText(text).width
    const list = { x: 29.5, y: 63.5, width: 312.6, height: 181 }
    const previewBox = { x: 352.1, y: 63.5, width: 209.4, height: 117.8 }
    ctx.setTransform(2, 0, 0, 2, 0, 0)
    ctx.fillStyle = "#000"
    ctx.fillRect(0, 0, 590, 390)
    ctx.strokeStyle = orange
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(18.75, 24.75, 552.5, 340.5, 10)
    ctx.stroke()
    ctx.textBaseline = "top"
    hits.current = []
    const activeIndex = hovered?.index ?? (keyboardSelected ? selected : -1)
    const activeSource = hovered ? Boolean(hovered.source) : sourceSelected
    const label = (
      value: string,
      x: number,
      y: number,
      size: number,
      color = orange
    ) => {
      ctx.font = `${size}px ArcadeFlauta, monospace`
      ctx.fillStyle = color
      if (font.current) font.current.draw(ctx, value, x, y, size, color)
      else ctx.fillText(value, x, y)
    }
    const tag = (
      value: string,
      x: number,
      y: number,
      size: number,
      active = false
    ) => {
      ctx.font = `${size}px ArcadeFlauta, monospace`
      const width = measure(value, size) + 8
      ctx.fillStyle = active ? orange : "#000"
      ctx.fillRect(x, y - 4, width, 16)
      label(value, x + 4, y, size, active ? "#000" : orange)
      return width
    }
    const closeWidth = tag("CLOSE [ESC]", 29.5, 21.5, 10, activeIndex === 0)
    hits.current.push({
      x: 29.5,
      y: 17.5,
      width: closeWidth,
      height: 16,
      index: 0
    })
    ctx.beginPath()
    ctx.moveTo(19.5, 51.5)
    ctx.lineTo(570.5, 51.5)
    ctx.stroke()
    tag("EXPERIMENTS", 31.5, 49.5, 11)
    tag("PREVIEW", 350.1, 49.5, 11)
    ctx.font = "9px ArcadeFlauta, monospace"
    const versionWidth = measure("LABS V1.0", 9) + 8
    tag("LABS V1.0", 558.5 - versionWidth, 362, 9)

    const drawImage = (
      url: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const cached = images.current.get(url)
      if (cached?.complete && cached.naturalWidth) {
        // Original images used objectFit="cover", including the featured cards.
        const scale = Math.max(
          width / cached.naturalWidth,
          height / cached.naturalHeight
        )
        const sw = width / scale,
          sh = height / scale
        ctx.drawImage(
          cached,
          (cached.naturalWidth - sw) / 2,
          (cached.naturalHeight - sh) / 2,
          sw,
          sh,
          x,
          y,
          width,
          height
        )
      } else if (!cached) {
        const image = new Image()
        image.crossOrigin = "anonymous"
        images.current.set(url, image)
        image.onload = image.onerror = () => setImageRevision((n) => n + 1)
        image.src = url
      }
    }

    ctx.save()
    ctx.beginPath()
    ctx.rect(list.x, list.y, list.width, list.height)
    ctx.clip()
    const rowWidth = list.width - 10
    for (let i = 0; i <= experiments.length; i++) {
      const y = list.y + i * 24 - scroll
      if (y + 24 <= list.y || y >= list.y + list.height) continue
      const index = i + 1
      const active = activeIndex === index
      const viewMore = i === experiments.length
      ctx.fillStyle = active ? orange : "#000"
      ctx.fillRect(list.x, y, rowWidth, 24)
      ctx.strokeStyle = orange
      ctx.lineWidth = 1
      ctx.strokeRect(list.x, y, rowWidth, 24)
      const color = active ? "#000" : orange
      const title = viewMore
        ? error
          ? "VISIT LAB.BASEMENT.STUDIO"
          : "VIEW MORE"
        : experiments[i]._title.toUpperCase()
      const titleWidth = viewMore ? rowWidth : rowWidth - 64
      ctx.save()
      ctx.beginPath()
      ctx.rect(list.x + 1, y, titleWidth - 2, 24)
      ctx.clip()
      ctx.font = "10px ArcadeFlauta, monospace"
      label(
        title,
        viewMore ? list.x + (rowWidth - measure(title, 10)) / 2 : list.x + 9,
        y + 9,
        10,
        color
      )
      ctx.restore()
      const hitTop = Math.max(y, list.y)
      const hitHeight = Math.min(y + 24, list.y + list.height) - hitTop
      hits.current.push({
        x: list.x,
        y: hitTop,
        width: titleWidth,
        height: hitHeight,
        index
      })
      if (!viewMore) {
        const sourceX = list.x + rowWidth - 52.5
        label("SOURCE", sourceX, y + 9, 10, color)
        if (active && activeSource) {
          ctx.fillStyle = color
          ctx.fillRect(sourceX, y + 18, 45, 2)
        }
        hits.current.push({
          x: list.x + titleWidth,
          y: hitTop,
          width: 64,
          height: hitHeight,
          index,
          source: true
        })
      }
    }
    ctx.restore()
    ctx.strokeStyle = orange
    ctx.lineWidth = 1
    ctx.strokeRect(list.x, list.y, list.width, list.height)
    const contentHeight = (experiments.length + 1) * 24
    if (contentHeight > list.height) {
      const thumbHeight = (list.height * list.height) / contentHeight
      const thumbTop =
        list.y +
        (scroll / (contentHeight - list.height)) * (list.height - thumbHeight)
      ctx.fillStyle = orange
      ctx.fillRect(
        list.x + list.width - 8,
        thumbTop + 2,
        6,
        Math.max(1, thumbHeight - 4)
      )
    }
    const preview = experiments[activeIndex - 1]
    drawImage(
      preview?.cover?.url || assets.arcade.placeholderLab,
      previewBox.x,
      previewBox.y,
      previewBox.width,
      previewBox.height
    )
    ctx.lineWidth = 1.5
    ctx.strokeRect(
      previewBox.x,
      previewBox.y,
      previewBox.width,
      previewBox.height
    )
    const description =
      (preview?.description?.toUpperCase() || "").slice(0, 100) +
      ((preview?.description?.length ?? 0) > 100 ? "..." : "")
    ctx.font = "10px ArcadeFlauta, monospace"
    let line = "",
      row = 0
    for (const word of description.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word
      if (measure(next, 10) > previewBox.width && line) {
        label(
          line,
          previewBox.x,
          previewBox.y + previewBox.height + 10 + row++ * 13,
          10
        )
        line = word
      } else line = next
    }
    label(
      line,
      previewBox.x,
      previewBox.y + previewBox.height + 10 + row * 13,
      10
    )

    const featured = [
      assets.arcade.chronicles,
      assets.arcade.looper,
      assets.arcade.shaderLab
    ]
    const titles = ["PLAY BASEMENT CHRONICLES", "PLAY LOOPER", "SHADER LAB"]
    const cardWidth = 532 / 3
    for (let i = 0; i < 3; i++) {
      const index = experiments.length + 2 + i
      const x = 29.5 + i * cardWidth
      drawImage(featured[i], x, 254.5, cardWidth, 100)
      ctx.lineWidth = 1
      ctx.strokeStyle = orange
      ctx.strokeRect(x, 254.5, cardWidth, 100)
      ctx.font = "8px ArcadeFlauta, monospace"
      const width = measure(titles[i], 8) + 8
      tag(
        titles[i],
        x + (cardWidth - width) / 2,
        304.5,
        8,
        activeIndex === index
      )
      hits.current.push({ x, y: 254.5, width: cardWidth, height: 100, index })
    }
    texture.needsUpdate = true
    invalidate()
    if (
      fontReady &&
      dataReady &&
      [...images.current.values()].every((image) => image.complete)
    )
      onLoadRef.current?.()
  }, [
    ctx,
    texture,
    experiments,
    selected,
    sourceSelected,
    keyboardSelected,
    hovered,
    scroll,
    fontReady,
    dataReady,
    imageRevision,
    error,
    tabs,
    assets,
    invalidate
  ])
  const hit = (point: { x: number; y: number }) =>
    hits.current.find(
      (h) =>
        point.x >= h.x &&
        point.x <= h.x + h.width &&
        point.y >= h.y &&
        point.y <= h.y + h.height
    )
  return (
    <mesh
      visible={visible}
      scale={[-1, -1, 1]}
      onPointerMove={(event) => {
        if (!event.uv) return
        const item = hit({ x: event.uv.x * 590, y: (1 - event.uv.y) * 390 })
        setHovered((previous) =>
          previous?.index === item?.index && previous?.source === item?.source
            ? previous
            : (item ?? null)
        )
      }}
      onPointerOut={() => setHovered(null)}
      onClick={(event) => {
        if (!event.uv) return
        const item = hit({ x: event.uv.x * 590, y: (1 - event.uv.y) * 390 })
        if (item) activate(item.index, item.source)
      }}
      onWheel={(event) => {
        event.stopPropagation()
        setHovered(null)
        setScroll((n) => Math.max(0, Math.min(maxScroll, n + event.deltaY)))
      }}
    >
      <planeGeometry args={[5.9, 3.9]} />
      <meshBasicMaterial map={texture} side={2} toneMapped={false} />
    </mesh>
  )
}
