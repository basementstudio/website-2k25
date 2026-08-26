import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { fetchFaqPage } from "@/app/(site)/(plain)/(content)/faq/sanity"
import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

export const metadata: Metadata = {
  title: "FAQ machine view",
  description:
    "Plain-text mirror of basement.studio's frequently asked questions for AI agents and crawlers.",
  // The human FAQ is the canonical document; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/faq" }
}

const MachineFaqPage = async () => {
  const faq = await fetchFaqPage()

  if (!faq?.entries.length) notFound()

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <MachineHeader current="/ai/faq" />
          <h1 className="text-machine-bright">
            basement.studio :: {faq.heading || "faq"}
          </h1>
          {faq.intro ? <p className="text-machine-dim"># {faq.intro}</p> : null}
          <dl className="flex flex-col gap-1">
            <Field label="questions">{faq.entries.length}</Field>
            <Field label="markdown">
              <a href="/faq.md" className={linkClass}>
                /faq.md
              </a>
            </Field>
            <Field label="human">
              <a href="/faq" className={linkClass}>
                /faq
              </a>
            </Field>
          </dl>
        </header>

        <Section title="faq">
          <ul className="flex flex-col gap-3">
            {faq.entries.map((entry) => (
              <li key={entry.question} className="flex flex-col gap-1">
                <h3 className="text-machine-bright">* {entry.question}</h3>
                <p>{entry.answer}</p>
              </li>
            ))}
          </ul>
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/faq" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineFaqPage
