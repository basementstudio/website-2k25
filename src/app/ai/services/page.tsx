import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { toPlainText } from "next-sanity"

import {
  fetchAwardsForMarkdown,
  fetchServicesPage,
  fetchTestimonial
} from "@/app/(site)/(canvas)/(content)/services/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { MachinePortableText } from "@/app/ai/machine-portable-text"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

export const metadata: Metadata = {
  title: "Services machine view",
  description:
    "Plain-text mirror of basement.studio's services for AI agents and crawlers: what we offer, ventures, and awards.",
  // The human services page is the canonical document; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/services" }
}

const MachineServicesPage = async () => {
  const [services, awards, testimonial] = await Promise.all([
    fetchServicesPage(),
    fetchAwardsForMarkdown(),
    fetchTestimonial()
  ])

  if (!services) notFound()

  // HTML (ventures.tsx) only shows the first venture — match that.
  const venture = services.ventures?.[0] ?? null

  // `role` is Portable Text or a plain string depending on document age.
  const testimonialRole = testimonial
    ? (Array.isArray(testimonial.role)
        ? toPlainText(testimonial.role)
        : (testimonial.role ?? "")
      )
        .replace(/\s+/g, " ")
        .trim()
    : ""

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile text-machine-base lg:text-f-p">
        {/* Header/meta stay uppercase like the /ai index; Portable Text bodies
          keep their authored casing for readability. */}
        <header className="flex flex-col gap-4 uppercase">
          <MachineHeader current="/ai/services" />
          <h1 className="text-machine-bright">basement.studio :: services</h1>
          <p className="text-machine-dim">
            # what the studio does, machine-readable.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="markdown">
              <a href="/services.md" className={linkClass}>
                /services.md
              </a>
            </Field>
            <Field label="human">
              <a href="/services" className={linkClass}>
                /services
              </a>
            </Field>
          </dl>
        </header>

        {services.intro?.length ? (
          <Section title="intro">
            <MachinePortableText blocks={services.intro} />
          </Section>
        ) : null}

        {services.serviceCategories?.length ? (
          <Section title="what_we_offer">
            <ul className="flex flex-col gap-3">
              {services.serviceCategories.map((category) => (
                <li key={category._key} className="flex flex-col gap-1">
                  <h3 className="uppercase text-machine-bright">
                    * {category.title}
                  </h3>
                  <MachinePortableText blocks={category.description} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {venture ? (
          <Section title="ventures">
            <div className="flex flex-col gap-1">
              <h3 className="uppercase text-machine-bright">
                * {venture.title}
              </h3>
              <MachinePortableText blocks={venture.content} />
            </div>
          </Section>
        ) : null}

        {awards.length ? (
          <Section title="awards">
            <ul className="flex flex-col gap-1 uppercase">
              {awards.map((award) => {
                const year = award.date
                  ? new Date(award.date).getFullYear()
                  : null
                const detail = [award.projectName, year]
                  .filter(Boolean)
                  .join(", ")
                return (
                  <li key={award._id}>
                    {"- "}
                    {award.awardUrl ? (
                      <a
                        href={award.awardUrl}
                        rel="noopener"
                        className={linkClass}
                      >
                        {award.title}
                      </a>
                    ) : (
                      award.title
                    )}
                    {detail ? ` — ${detail}` : null}
                  </li>
                )
              })}
            </ul>
          </Section>
        ) : null}

        {testimonial?.content ? (
          <Section title="testimonial">
            <blockquote className="flex flex-col gap-1">
              <p>&gt; {testimonial.content}</p>
              <footer className="text-machine-dim">
                &gt; —{" "}
                {[
                  testimonial.name,
                  testimonial.handle
                    ? `(${testimonial.handle.startsWith("@") ? testimonial.handle : `@${testimonial.handle}`})`
                    : null,
                  testimonialRole ? `— ${testimonialRole}` : null
                ]
                  .filter(Boolean)
                  .join(" ")}
              </footer>
            </blockquote>
          </Section>
        ) : null}

        <footer className="flex flex-col gap-1 uppercase text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/services" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineServicesPage
