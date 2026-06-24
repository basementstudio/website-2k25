import type { Metadata } from "next"

import { Link } from "@/components/primitives/link"

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "https://basement.studio/privacy"
  }
}

// =============================================================================
// TODO: legal to review/replace
//
// The copy below is DRAFT / placeholder scaffolding only. It is NOT a legal
// privacy policy and must be reviewed and replaced with real, lawyer-approved
// language before this page is treated as authoritative. The goal of this file
// is to establish the /privacy route and a correct section structure; the
// actual policy text comes from a human / legal.
// =============================================================================

const lastUpdated = "DRAFT — not yet published"

interface Section {
  id: string
  title: string
  body: string[]
}

const SECTIONS: Section[] = [
  {
    id: "data-we-collect",
    title: "What data we collect",
    body: [
      "DRAFT placeholder: Describe the categories of personal data collected, e.g. information submitted through the contact form (name, email, message), newsletter sign-ups, and any data collected automatically (such as device and usage information). Replace with the real list of data collected by basement.studio."
    ]
  },
  {
    id: "cookies-analytics",
    title: "Cookies and analytics",
    body: [
      "DRAFT placeholder: Describe the cookies and analytics tools in use and their purpose. Replace with the real, current list before publishing."
    ]
  },
  {
    id: "third-parties",
    title: "Third parties",
    body: [
      "DRAFT placeholder: List the third-party service providers and processors that may receive personal data (e.g. analytics, email, hosting, form handling) and the purpose of each. Replace with the real list of subprocessors."
    ]
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: [
      "DRAFT placeholder: Describe how long each category of data is retained and the criteria used to determine retention periods. Replace with the real retention policy."
    ]
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: [
      "DRAFT placeholder: Describe the rights available to users (e.g. access, correction, deletion, objection, data portability) and how to exercise them, including any applicable legal bases. Replace with the real, jurisdiction-appropriate rights language."
    ]
  },
  {
    id: "contact",
    title: "Contact for privacy requests",
    body: [
      "DRAFT placeholder: For privacy-related questions or requests, contact basement.studio. Confirm the correct privacy contact address before publishing."
    ]
  }
]

const PrivacyPolicy = () => (
  <div className="grid-layout">
    <section className="col-span-full flex flex-col gap-8 text-brand-w1 lg:col-start-2 lg:col-end-11 2xl:col-start-3">
      <header className="flex flex-col gap-2">
        <h1 className="text-f-h0-mobile text-brand-w2 lg:text-f-h0">
          Privacy Policy
        </h1>
        <p className="text-f-p-mobile text-brand-g1 lg:text-f-p">
          Last updated: {lastUpdated}
        </p>
        <p className="text-f-h4-mobile text-brand-w2 lg:text-f-h4">
          This page is a draft scaffold. The sections below are placeholders and
          do not yet constitute a legally binding privacy policy.
        </p>
      </header>

      {SECTIONS.map((section) => (
        <section key={section.id} className="flex flex-col gap-2">
          <h2 className="text-f-h3-mobile text-brand-g1 lg:text-f-h3">
            {section.title}
          </h2>
          {section.body.map((paragraph, index) => (
            <p
              key={index}
              className="text-f-h4-mobile text-brand-w2 lg:text-f-h4"
            >
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      <p className="text-f-p-mobile text-brand-g1 lg:text-f-p">
        Questions? Reach us at{" "}
        <Link href="mailto:hello@basement.studio" target="_blank">
          <span className="actionable">hello@basement.studio</span>
        </Link>{" "}
        or via the{" "}
        <Link href="/contact">
          <span className="actionable">contact page</span>
        </Link>
        .
      </p>
    </section>
  </div>
)

export default PrivacyPolicy
