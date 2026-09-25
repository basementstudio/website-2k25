import type { Metadata } from "next"

import { fetchLabProjects } from "@/actions/laboratory-fetch/sanity"
import { Field, linkClass, MachineLink, Section } from "@/app/ai/components"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

export const metadata: Metadata = {
  title: "Lab machine view",
  description:
    "Plain-text index of basement.studio's lab experiments and interactive demos for AI agents and crawlers.",
  // The human lab is the canonical document; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/lab" }
}

// `published: true` is the Live, tag-registering fetch and is only valid
// inside a "use cache" scope.
async function getLabProjects() {
  "use cache"
  return fetchLabProjects({ published: true })
}

const MachineLabPage = async () => {
  const projects = await getLabProjects()

  return (
    <>
      <PageJsonLd />
      {/* display:contents keeps the sections in the template's flex gap while
        cascading the index's uppercase styling. */}
      <div className="contents uppercase">
        <header className="flex flex-col gap-4">
          <h1 className="text-machine-bright">basement.studio :: lab</h1>
          <p className="text-machine-dim">
            # experiments and interactive demos built by basement.studio. the
            arcade at /lab is a desktop webgl experience; a lightweight mirror
            lives at lab.basement.studio.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="experiments">{projects.length}</Field>
            <Field label="mirror">
              <a
                href="https://lab.basement.studio/"
                target="_blank"
                rel="noopener"
                className={linkClass}
              >
                lab.basement.studio
              </a>
            </Field>
            <Field label="markdown">
              <a href="/lab.md" className={linkClass}>
                /lab.md
              </a>
            </Field>
            <Field label="human">
              <a href="/lab" className={linkClass}>
                /lab
              </a>
            </Field>
          </dl>
        </header>

        <Section title="experiments">
          {projects.length ? (
            <ul className="flex flex-col gap-1">
              {/* `url` is the experiment's source path (e.g.
                "30.wireframe-reveal.js"); the live demo lives under
                lab.basement.studio (see arcade-labs-list.tsx). */}
              {projects.map((project) => (
                <li key={project.url}>
                  {"- "}
                  <a
                    href={`https://lab.basement.studio/experiments/${project.url}`}
                    target="_blank"
                    rel="noopener"
                    className={linkClass}
                  >
                    {project.title}
                  </a>
                  {project.description ? ` — ${project.description}` : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-machine-dim"># no experiments published</p>
          )}
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <MachineLink href="/ai/home">back to machine index</MachineLink> ·{" "}
            <a href="/lab" className={linkClass}>
              play as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </div>
    </>
  )
}

export default MachineLabPage
