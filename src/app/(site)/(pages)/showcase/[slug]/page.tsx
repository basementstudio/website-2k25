import { notFound } from "next/navigation"

import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateCreativeWorkSchema } from "@/lib/structured-data/schemas/creative-work"

import {
  fetchAllProjectSlugs,
  fetchProjectBySlug,
  fetchProjectMeta
} from "./sanity"
import { ProjectWrapper } from "./wrapper"

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
      absolute: `${meta.title ?? "Untitled"} | Showcase`
    },
    alternates: {
      canonical: `https://basement.studio/showcase/${slug}`
    }
  }
}

const ProjectPost = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const project = await fetchProjectBySlug(slug)

  if (!project) return notFound()

  const creativeWorkSchema = generateCreativeWorkSchema({
    title: project.title,
    slug: project.slug,
    year: project.year,
    categories: project.categories,
    client: project.client,
    cover: project.cover,
    content: project.content,
    projectWebsite: project.projectWebsite,
    awards:
      project.awards?.map((a) => ({
        title: a.title,
        date: a.date,
        projectName: project.title
      })) ?? null
  })

  return (
    <>
      {creativeWorkSchema ? <JsonLd data={creativeWorkSchema} /> : null}
      <ProjectWrapper entry={project} />
    </>
  )
}

// generate static pages for all projects
export const generateStaticParams = async () => {
  const slugs = await fetchAllProjectSlugs()
  return (slugs ?? []).map((p) => ({ slug: p.slug }))
}

export default ProjectPost
