"use client"

import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { Link } from "@/components/primitives/link"
import { useMedia } from "@/hooks/use-media"
import { useCursor } from "@/hooks/use-mouse"

import { QueryType } from "./query"

interface ShowcaseImageProps {
  project: QueryType["pages"]["homepage"]["featuredProjects"]["projectList"]["items"][0]
}

export const ShowcaseImage = ({ project }: ShowcaseImageProps) => {
  const setCursor = useCursor()
  const isCursorHover = useMedia("(hover: hover)")

  // TODO: Add required in basehub to avoid this
  if (!project.cover) return null

  return (
    <Link
      href={`/showcase/${project.project?._slug}`}
      onMouseEnter={() => {
        if (isCursorHover) setCursor("zoom-in", "View Project")
      }}
      onMouseLeave={() => setCursor("default", null)}
    >
      <div className="with-dots relative h-full w-full">
        <ImageWithVideoOverlay
          image={project.cover}
          video={project.coverVideo || project.project?.coverVideo}
          className="aspect-video"
        />
      </div>
    </Link>
  )
}
