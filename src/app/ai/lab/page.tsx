import type { Metadata } from "next"

import { fetchLabProjects } from "@/actions/laboratory-fetch/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
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
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <nav
            aria-label="Machine index"
            className="flex flex-wrap gap-x-4 gap-y-1"
          >
            <a href="/ai" className={linkClass}>
              /ai
            </a>
            <span className="text-machine-dim">::</span>
            <span className="text-machine-dim">lab</span>
          </nav>
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
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/lab" className={linkClass}>
              play as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineLabPage
