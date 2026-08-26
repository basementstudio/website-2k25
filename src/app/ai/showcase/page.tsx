import type { Metadata } from "next"

import { fetchShowcaseListForMarkdown } from "@/app/(site)/(canvas)/(content)/showcase/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { truncateDescription } from "@/utils/seo"

export const metadata: Metadata = {
  title: "Showcase machine view",
  description:
    "Plain-text index of basement.studio's selected projects for AI agents and crawlers.",
  // The human showcase is the canonical index; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/showcase" }
}

const MachineShowcasePage = async () => {
  const projects = await fetchShowcaseListForMarkdown()

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <MachineHeader current="/ai/showcase" />
          <h1 className="text-machine-bright">
            basement.studio :: showcase index
          </h1>
          <p className="text-machine-dim">
            # selected projects by basement.studio, machine-readable. append .md
            to any project url for raw markdown.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="projects">{projects.length}</Field>
            <Field label="markdown">
              <a href="/showcase.md" className={linkClass}>
                /showcase.md
              </a>
            </Field>
            <Field label="human">
              <a href="/showcase" className={linkClass}>
                /showcase
              </a>
            </Field>
          </dl>
        </header>

        <Section title="projects">
          {projects.length ? (
            <ul className="flex flex-col gap-1">
              {projects.map((project) => {
                const clientYear = [project.client, project.year]
                  .filter(Boolean)
                  .join(", ")
                const excerpt = truncateDescription(project.description)
                return (
                  <li key={project.slug}>
                    {"- "}
                    <a
                      href={`/ai/showcase/${project.slug}`}
                      className={linkClass}
                    >
                      {project.title}
                    </a>
                    {clientYear ? ` (${clientYear})` : null}
                    {project.categories?.length ? (
                      <span className="text-machine-dim">
                        {" "}
                        {project.categories
                          .map((category) => `[${category}]`)
                          .join(" ")}
                      </span>
                    ) : null}
                    {excerpt ? ` — ${excerpt}` : null}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-machine-dim"># no projects published</p>
          )}
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/showcase" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineShowcasePage
