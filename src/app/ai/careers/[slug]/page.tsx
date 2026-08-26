import type { Metadata } from "next"
import { notFound } from "next/navigation"

import {
  fetchAllOpenPositionSlugs,
  fetchCareerPositionMeta,
  getPositionData
} from "@/app/(site)/(plain)/(content)/careers/[slug]/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { MachinePortableText } from "@/app/ai/machine-portable-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

interface MachineCareerProps {
  params: Promise<{ slug: string }>
}

export const generateMetadata = async ({
  params
}: MachineCareerProps): Promise<Metadata | null> => {
  const { slug } = await params
  const position = await fetchCareerPositionMeta(slug)

  if (!position) return null

  return {
    title: { absolute: `${position.title ?? "Untitled"} | Machine view` },
    description: `Machine-readable mirror of the ${position.title ?? "open position"} role at basement.studio.`,
    // The human position page is the canonical document; this page is a styled mirror.
    alternates: { canonical: `https://basement.studio/careers/${slug}` }
  }
}

const MachineCareerPage = async ({ params }: MachineCareerProps) => {
  const { slug } = await params
  const position = await getPositionData(slug)

  // Closed roles 404 at request time, mirroring the human careers page.
  if (!position || !position.isOpen) return notFound()

  const skills = position.applyFormSetup?.skills
    ?.map((skill) => skill.title)
    .filter(Boolean)

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile text-machine-base lg:text-f-p">
        {/* Header/meta stay uppercase like the /ai index; the job description
          keeps its authored casing for readability. */}
        <header className="flex flex-col gap-4 uppercase">
          <MachineHeader current="/ai/people" />
          <h1 className="text-machine-bright">{position.title}</h1>
          <dl className="flex flex-col gap-1">
            {position.type ? <Field label="type">{position.type}</Field> : null}
            {position.employmentType ? (
              <Field label="employment">{position.employmentType}</Field>
            ) : null}
            {position.location ? (
              <Field label="location">{position.location}</Field>
            ) : null}
            {skills?.length ? (
              <Field label="skills">{skills.join(", ")}</Field>
            ) : null}
            {position.applyUrl ? (
              <Field label="apply">
                <a
                  href={position.applyUrl}
                  rel="noopener"
                  className={linkClass}
                >
                  {position.applyUrl}
                </a>
              </Field>
            ) : null}
            <Field label="markdown">
              <a href={`/careers/${position.slug}.md`} className={linkClass}>
                /careers/{position.slug}.md
              </a>
            </Field>
            <Field label="human">
              <a href={`/careers/${position.slug}`} className={linkClass}>
                /careers/{position.slug}
              </a>
            </Field>
          </dl>
        </header>

        <Section title="job_description">
          <article className="flex flex-col gap-4">
            <MachinePortableText blocks={position.jobDescription} />
          </article>
        </Section>

        <Section title="how_to_apply">
          <p className="uppercase text-machine-dim">
            # the application form lives on the human page —{" "}
            <a href={`/careers/${position.slug}`} className={linkClass}>
              /careers/{position.slug}
            </a>
          </p>
        </Section>

        <footer className="flex flex-col gap-1 uppercase text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/ai/people" className={linkClass}>
              all positions
            </a>{" "}
            ·{" "}
            <a href={`/careers/${position.slug}`} className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineCareerPage

export async function generateStaticParams() {
  const slugs = await fetchAllOpenPositionSlugs()
  return slugs.map((slug) => ({ slug }))
}
