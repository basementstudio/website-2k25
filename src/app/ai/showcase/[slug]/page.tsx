import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  fetchAllProjectSlugs,
  fetchProjectMeta,
  fetchRelatedProjectSlugs,
  getProjectData
} from "@/app/(site)/(plain)/(content)/showcase/[slug]/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { MachinePortableText } from "@/app/ai/machine-portable-text"
import { extractPlainText } from "@/lib/structured-data/extract-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { truncateDescription } from "@/utils/seo"

interface MachineProjectProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params
}: MachineProjectProps): Promise<Metadata | null> => {
  const { slug } = await params
  const project = await fetchProjectMeta(slug)

  if (!project) return null

  return {
    title: { absolute: `${project.title ?? "Untitled"} | Machine view` },
    description:
      truncateDescription(extractPlainText(project.content)) ||
      `Machine-readable mirror of the ${project.title ?? "project"} case study by basement.studio.`,
    // The human project page is the canonical document; this page is a styled mirror.
    alternates: { canonical: `https://basement.studio/showcase/${slug}` }
  }
}

const MachineProjectPage = async ({ params }: MachineProjectProps) => {
  const { slug } = await params
  const project = await getProjectData(slug)

  if (!project) return notFound()

  const relatedProjects = await fetchRelatedProjectSlugs(slug)

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile text-machine-base lg:text-f-p">
        {/* Header/meta stay uppercase like the /ai index; the project body keeps
          its authored casing for readability. */}
        <header className="flex flex-col gap-4 uppercase">
          <MachineHeader current="/ai/showcase" />
          <h1 className="text-machine-bright">{project.title}</h1>
          <dl className="flex flex-col gap-1">
            {project.client ? (
              <Field label="client">
                {project.client.website ? (
                  <a
                    href={project.client.website}
                    target="_blank"
                    rel="noopener"
                    className={linkClass}
                  >
                    {project.client.title}
                  </a>
                ) : (
                  project.client.title
                )}
              </Field>
            ) : null}
            {project.year ? <Field label="year">{project.year}</Field> : null}
            {project.categories?.length ? (
              <Field label="categories">
                {project.categories
                  .map((category) => `[${category.title}]`)
                  .join(" ")}
              </Field>
            ) : null}
            {project.projectWebsite ? (
              <Field label="website">
                <a
                  href={project.projectWebsite}
                  target="_blank"
                  rel="noopener"
                  className={linkClass}
                >
                  {project.projectWebsite}
                </a>
              </Field>
            ) : null}
            {project.caseStudy ? (
              <Field label="case_study">
                <a
                  href={project.caseStudy}
                  target="_blank"
                  rel="noopener"
                  className={linkClass}
                >
                  {project.caseStudy}
                </a>
              </Field>
            ) : null}
            {project.people?.length ? (
              <Field label="team">
                {project.people
                  .map((person) =>
                    person.department
                      ? `${person.title} (${person.department.title})`
                      : person.title
                  )
                  .join(", ")}
              </Field>
            ) : null}
            {project.awards?.length ? (
              <Field label="awards">
                {project.awards.map((award) => award.title).join(", ")}
              </Field>
            ) : null}
            <Field label="markdown">
              <a href={`/showcase/${project.slug}.md`} className={linkClass}>
                /showcase/{project.slug}.md
              </a>
            </Field>
            <Field label="human">
              <a href={`/showcase/${project.slug}`} className={linkClass}>
                /showcase/{project.slug}
              </a>
            </Field>
          </dl>
        </header>

        <Section title="project">
          <article className="flex flex-col gap-4">
            <MachinePortableText blocks={project.content} />
          </article>
        </Section>

        {relatedProjects.length ? (
          <Section title="related_projects">
            <ul className="flex flex-col gap-1 uppercase">
              {relatedProjects.map((related) => (
                <li key={related._id}>
                  {"- "}
                  <a
                    href={`/ai/showcase/${related.slug}`}
                    className={linkClass}
                  >
                    {related.title}
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <footer className="flex flex-col gap-1 uppercase text-machine-dim">
          <p>
            <a href="/ai/home" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/ai/showcase" className={linkClass}>
              all projects
            </a>{" "}
            ·{" "}
            <a href={`/showcase/${project.slug}`} className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineProjectPage

export async function generateStaticParams() {
  const slugs = await fetchAllProjectSlugs()
  return (slugs ?? []).map(({ slug }) => ({ slug }))
}
