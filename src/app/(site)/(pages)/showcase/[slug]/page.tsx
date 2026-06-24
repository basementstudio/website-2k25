import { notFound } from "next/navigation"

import { extractPlainText } from "@/lib/structured-data/extract-text"
import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateBreadcrumbSchema } from "@/lib/structured-data/schemas/breadcrumb"
import { generateCreativeWorkSchema } from "@/lib/structured-data/schemas/creative-work"
import { truncateDescription } from "@/utils/seo"

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

  const title = meta.title ?? "Untitled"
  const description =
    truncateDescription(extractPlainText(meta.content)) ||
    `Discover ${title}, a project by basement.studio — see how we designed and engineered it.`

  return {
    title: {
      absolute: `${title} | Showcase`
    },
    description,
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

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Showcase", path: "/showcase" },
    { name: project.title ?? "Untitled", path: `/showcase/${project.slug}` }
  ])

  return (
    <>
      {creativeWorkSchema ? <JsonLd data={creativeWorkSchema} /> : null}
      <JsonLd data={breadcrumbSchema} />
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
