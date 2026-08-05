import type { Metadata } from "next"
import { toPlainText } from "next-sanity"

import { fetchHomepage } from "@/app/(site)/(canvas)/(content)/(home)/sanity"
import {
  fetchFeaturedPost,
  fetchPosts
} from "@/app/(site)/(canvas)/(content)/blog/sanity"
import { fetchOpenPositions } from "@/app/(site)/(canvas)/(content)/people/sanity"
import { fetchServicesPage } from "@/app/(site)/(canvas)/(content)/services/sanity"
import { fetchShowcaseListForMarkdown } from "@/app/(site)/(canvas)/(content)/showcase/sanity"
import { fetchCompanyInfo, fetchCurrentYear } from "@/components/layout/sanity"
import { COMPANY_FACTS, formatFactList } from "@/lib/company-facts"
import { fetchOrganizationData } from "@/service/sanity/organization"
import type { PortableTextBlock } from "@/service/sanity/types"

import { Field, linkClass, Section } from "./components"

export const metadata: Metadata = {
  title: "Machine view",
  description:
    "Plain-text index of basement.studio for AI agents and crawlers: who the studio is, services, clients, projects, writing, and contact.",
  alternates: { canonical: "/ai" }
}

// "BSMNT" — ANSI-shadow block letters. Decorative only; entity data below is
// what crawlers read.
const ASCII_LOGO = `██████╗ ███████╗███╗   ███╗███╗   ██╗████████╗
██╔══██╗██╔════╝████╗ ████║████╗  ██║╚══██╔══╝
██████╔╝███████╗██╔████╔██║██╔██╗ ██║   ██║
██╔══██╗╚════██║██║╚██╔╝██║██║╚██╗██║   ██║
██████╔╝███████║██║ ╚═╝ ██║██║ ╚████║   ██║
╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝   ╚═╝`

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/services", label: "services" },
  { href: "/showcase", label: "showcase" },
  { href: "/people", label: "people" },
  // The blog stays in the machine format — it has its own machine index.
  { href: "/ai/blog", label: "blog" },
  { href: "/lab", label: "lab" },
  { href: "/contact", label: "contact" }
]

const AGENT_RESOURCES = [
  { href: "/llms.txt", label: "llms.txt" },
  { href: "/agents.md", label: "agents.md" },
  { href: "/sitemap.md", label: "sitemap.md" },
  { href: "/index.md", label: "index.md" },
  { href: "/services.md", label: "services.md" },
  { href: "/people.md", label: "people.md" },
  { href: "/showcase.md", label: "showcase.md" }
]

const plainText = (blocks: PortableTextBlock[] | null) =>
  blocks?.length ? toPlainText(blocks) : ""

const AiPage = async () => {
  const [
    { homepage },
    servicesPage,
    positions,
    showcaseList,
    featuredPost,
    { posts },
    companyInfo,
    orgData,
    year
  ] = await Promise.all([
    fetchHomepage({ published: true }),
    fetchServicesPage({ published: true }),
    fetchOpenPositions({ published: true }),
    fetchShowcaseListForMarkdown(),
    fetchFeaturedPost(),
    fetchPosts(),
    fetchCompanyInfo(),
    fetchOrganizationData(),
    fetchCurrentYear()
  ])

  // The no-category posts query intentionally skips the newest post (the blog
  // renders it separately as featured) — merge it back in here.
  const latestPosts = [featuredPost, ...posts]
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .slice(0, 10)

  const openPositions = positions.filter((p) => p.isOpen)

  const socialLinks = [
    { label: "x-twitter", url: companyInfo.twitter },
    { label: "instagram", url: companyInfo.instagram },
    { label: "github", url: companyInfo.github },
    { label: "linkedin", url: companyInfo.linkedIn }
  ].filter((s): s is { label: string; url: string } => Boolean(s.url))

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 pb-24 pt-12 text-f-p-mobile uppercase text-machine-base lg:text-f-p">
      <header className="flex flex-col gap-4">
        {/* Font size scales with the viewport (46-char-wide art), capped so
            the logo sits at roughly 3/4 of the content column. */}
        <pre
          aria-hidden="true"
          className="w-full text-[min(16px,calc((100vw-2rem)/38))] leading-tight text-machine-base"
        >
          {ASCII_LOGO}
        </pre>
        <h1 className="text-machine-bright">
          basement.studio :: machine-readable index
        </h1>
        <p className="text-machine-dim">
          # plain-text mirror of basement.studio for AI agents, crawlers, and
          humans who prefer it raw.
        </p>
        <nav aria-label="Site index" className="flex flex-wrap gap-x-4 gap-y-1">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={linkClass}>
              {link.href}
            </a>
          ))}
        </nav>
      </header>

      <Section title="about">
        <dl className="flex flex-col gap-1">
          <Field label="name">{COMPANY_FACTS.name}</Field>
          <Field label="aka">
            {/* The page's CSS uppercasing collapses the "Basement Studio" /
                "basement studio" JSON-LD variants into visible duplicates —
                keep them out of the display (they stay in alternateName). */}
            {COMPANY_FACTS.alternateNames
              .filter((name) => name.toLowerCase() !== "basement studio")
              .join(", ")}
          </Field>
          <Field label="founded">{COMPANY_FACTS.foundingDate}</Field>
          <Field label="location">
            {COMPANY_FACTS.locationName} ({COMPANY_FACTS.addressCountry})
          </Field>
          <Field label="area_served">{COMPANY_FACTS.areaServed}</Field>
          <Field label="services">{COMPANY_FACTS.services.join(", ")}</Field>
          <Field label="clients">
            {COMPANY_FACTS.notableClients.join(", ")}
          </Field>
          <Field label="knows_about">
            {COMPANY_FACTS.knowsAbout.join(", ")}
          </Field>
        </dl>
        <p>{COMPANY_FACTS.description}</p>
        <p>
          Founded in {COMPANY_FACTS.foundingDate} and based in{" "}
          {COMPANY_FACTS.locationName}, the studio works primarily with
          technology companies in the San Francisco Bay Area and has partnered
          with startups and enterprise brands including{" "}
          {formatFactList(COMPANY_FACTS.notableClients)}.
        </p>
        <p>{COMPANY_FACTS.awardsSummary}</p>
        <p>{COMPANY_FACTS.geistAttribution}</p>
      </Section>

      {homepage?.capabilities?.length ? (
        <Section title="capabilities">
          <ul className="flex flex-col gap-3">
            {homepage.capabilities.map((cap) => (
              <li key={cap._id} className="flex flex-col gap-1">
                <h3 className="text-machine-bright">* {cap.title}</h3>
                {cap.description ? <p>{cap.description}</p> : null}
                {cap.subcategories?.length ? (
                  <p className="text-machine-dim">
                    {cap.subcategories.map((s) => `[${s.title}]`).join(" ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {servicesPage?.ventures?.length ? (
        <Section title="ventures">
          <ul className="flex flex-col gap-3">
            {servicesPage.ventures.map((venture) => (
              <li key={venture._key} className="flex flex-col gap-1">
                <h3 className="text-machine-bright">* {venture.title}</h3>
                {plainText(venture.content) ? (
                  <p>{plainText(venture.content)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {homepage?.clients?.length ? (
        <Section title="clients">
          <p>
            {homepage.clients.map((client, i) => (
              <span key={client._id}>
                {i > 0 ? ", " : null}
                {client.website ? (
                  <a href={client.website} rel="noopener" className={linkClass}>
                    {client.title}
                  </a>
                ) : (
                  client.title
                )}
              </span>
            ))}
          </p>
        </Section>
      ) : null}

      {homepage?.featuredProjects?.length ? (
        <Section title="selected_work">
          <ul className="flex flex-col gap-1">
            {homepage.featuredProjects.map((item) => {
              const label = item.title || item.project?.title || "Untitled"
              const slug = item.project?.slug?.current
              return (
                <li key={item._key}>
                  {"- "}
                  {slug ? (
                    <a href={`/showcase/${slug}.md`} className={linkClass}>
                      {label}
                    </a>
                  ) : (
                    label
                  )}
                  {item.excerpt ? ` — ${item.excerpt}` : null}
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}

      {showcaseList.length ? (
        <Section title="showcase">
          <ul className="flex flex-col gap-1">
            {showcaseList.map((project) => {
              const detail = [project.client, project.year]
                .filter(Boolean)
                .join(", ")
              return (
                <li key={project.slug}>
                  {"- "}
                  <a
                    href={`/showcase/${project.slug}.md`}
                    className={linkClass}
                  >
                    {project.title}
                  </a>
                  {detail ? ` (${detail})` : null}
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}

      {latestPosts.length ? (
        <Section title="latest_writing">
          <ul className="flex flex-col gap-1">
            {latestPosts.map((post) => (
              <li key={post._id}>
                {"- "}
                {post.date ? (
                  <span className="text-machine-dim">
                    {post.date.split("T")[0]}{" "}
                  </span>
                ) : null}
                <a href={`/ai/post/${post.slug}`} className={linkClass}>
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
          <p className="text-machine-dim">
            #{" "}
            <a href="/ai/blog" className={linkClass}>
              full archive: /ai/blog
            </a>
          </p>
        </Section>
      ) : null}

      <Section title="open_positions">
        {openPositions.length ? (
          <ul className="flex flex-col gap-1">
            {openPositions.map((position) => {
              const detail = [position.type, position.location]
                .filter(Boolean)
                .join(", ")
              return (
                <li key={position.slug}>
                  {"- "}
                  <a
                    href={`/careers/${position.slug}.md`}
                    className={linkClass}
                  >
                    {position.title}
                  </a>
                  {detail ? ` (${detail})` : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p>none currently open</p>
        )}
      </Section>

      <Section title="contact">
        <dl className="flex flex-col gap-1">
          {orgData.contactPoints.map((contact) => (
            <Field key={contact.email} label={contact.contactType}>
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </Field>
          ))}
          <Field label="form">
            <a href="/contact" className={linkClass}>
              /contact
            </a>
          </Field>
          {socialLinks.map((social) => (
            <Field key={social.label} label={social.label}>
              <a href={social.url} rel="noopener" className={linkClass}>
                {social.url}
              </a>
            </Field>
          ))}
        </dl>
      </Section>

      <Section title="for_agents">
        <dl className="flex flex-col gap-1">
          {AGENT_RESOURCES.map((resource) => (
            <Field key={resource.href} label={resource.label}>
              <a href={resource.href} className={linkClass}>
                {resource.href}
              </a>
            </Field>
          ))}
        </dl>
        <p className="text-machine-dim">
          # every page also serves markdown: append .md to a URL, or request it
          with Accept: text/markdown
        </p>
      </Section>

      <footer className="flex flex-col gap-1 text-machine-dim">
        <p>
          © {year} {COMPANY_FACTS.name} —{" "}
          <a href="/" className={linkClass}>
            back to human site
          </a>
        </p>
        <p>/* EOF */</p>
      </footer>
    </main>
  )
}

export default AiPage
