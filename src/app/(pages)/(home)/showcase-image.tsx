"use client"

import { ImageWithVideoOverlay } from "@/components/primitives/image-with-video-overlay"
import { Link } from "@/components/primitives/link"
import { useCursor } from "@/hooks/use-mouse"

import { QueryType } from "./query"

interface ShowcaseImageProps {
  project: QueryType["pages"]["homepage"]["featuredProjects"]["projectList"]["items"][0]
}

export const ShowcaseImage = ({ project }: ShowcaseImageProps) => {
  const setCursor = useCursor()

  if (!project.cover) return null
  return (
    <Link
      href={`/showcase/${project.project?._slug}`}
      onMouseEnter={() => setCursor("zoom-in", "View project")}
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
