import { notFound } from "next/navigation"

import { ProjectWrapper } from "./wrapper"
import {
  fetchAllProjectSlugs,
  fetchProjectBySlug,
  fetchProjectMeta,
} from "./sanity"

interface ProjectPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

export const generateMetadata = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const meta = await fetchProjectMeta(slug)

  if (!meta) return null

  return {
    title: {
      absolute: `${meta.title ?? "Untitled"} | Showcase`,
    },
    alternates: {
      canonical: `https://basement.studio/showcase/${slug}`,
    },
  }
}

const ProjectPost = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const project = await fetchProjectBySlug(slug)

  if (!project) return notFound()

  return <ProjectWrapper entry={project} />
}

// generate static pages for all projects
export const generateStaticParams = async () => {
  const slugs = await fetchAllProjectSlugs()
  return (slugs ?? []).map((p) => ({ slug: p.slug }))
}

export default ProjectPost
