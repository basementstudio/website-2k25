import type { Metadata } from "next"

import { Field, linkClass, Section } from "@/app/ai/components"
import { MachineHeader } from "@/app/ai/machine-header"
import { fetchCompanyInfo } from "@/components/layout/sanity"
import { COMPANY_FACTS } from "@/lib/company-facts"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { fetchOrganizationData } from "@/service/sanity/organization"

export const metadata: Metadata = {
  title: "Contact machine view",
  description:
    "Plain-text mirror of basement.studio's contact channels for AI agents and crawlers: email, social, and how to start a project.",
  // The human contact page is the canonical document; this page is a styled mirror.
  alternates: { canonical: "https://basement.studio/contact" }
}

const MachineContactPage = async () => {
  const [orgData, companyInfo] = await Promise.all([
    fetchOrganizationData(),
    fetchCompanyInfo()
  ])

  const socialLinks = [
    { label: "𝕏", url: companyInfo.twitter },
    { label: "instagram", url: companyInfo.instagram },
    { label: "github", url: companyInfo.github },
    { label: "linkedin", url: companyInfo.linkedIn }
  ].filter((social): social is { label: string; url: string } =>
    Boolean(social.url)
  )

  return (
    <>
      <PageJsonLd />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
        <header className="flex flex-col gap-4">
          <MachineHeader current="/ai/contact" />
          <h1 className="text-machine-bright">basement.studio :: contact</h1>
          <p className="text-machine-dim">
            # tell us about your project — brands, websites, 3D experiences, or
            products — and let&apos;s make cool shit that performs.
          </p>
          <dl className="flex flex-col gap-1">
            <Field label="based_in">{COMPANY_FACTS.locationName}</Field>
            <Field label="area_served">{COMPANY_FACTS.areaServed}</Field>
            <Field label="markdown">
              <a href="/contact.md" className={linkClass}>
                /contact.md
              </a>
            </Field>
            <Field label="human">
              <a href="/contact" className={linkClass}>
                /contact
              </a>
            </Field>
          </dl>
        </header>

        <Section title="email">
          <dl className="flex flex-col gap-1">
            {orgData.contactPoints.map((contact) => (
              <Field key={contact.email} label={contact.contactType}>
                <a href={`mailto:${contact.email}`} className={linkClass}>
                  {contact.email}
                </a>
              </Field>
            ))}
          </dl>
        </Section>

        {socialLinks.length ? (
          <Section title="social">
            <dl className="flex flex-col gap-1">
              {socialLinks.map((social) => (
                <Field key={social.label} label={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener"
                    className={linkClass}
                  >
                    {social.url}
                  </a>
                </Field>
              ))}
            </dl>
          </Section>
        ) : null}

        <Section title="start_a_project">
          <p className="text-machine-dim">
            # the project form lives on the human page — it includes project
            type and budget fields so your inquiry reaches the right people.
          </p>
          <p>
            <a href="/contact" className={linkClass}>
              /contact
            </a>
          </p>
        </Section>

        <footer className="flex flex-col gap-1 text-machine-dim">
          <p>
            <a href="/ai" className={linkClass}>
              back to machine index
            </a>{" "}
            ·{" "}
            <a href="/contact" className={linkClass}>
              read as human
            </a>
          </p>
          <p>/* EOF */</p>
        </footer>
      </main>
    </>
  )
}

export default MachineContactPage
