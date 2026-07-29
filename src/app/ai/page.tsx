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

export const metadata: Metadata = {
  title: "Machine view",
  description:
    "Plain-text index of basement.studio for AI agents and crawlers: who the studio is, services, clients, projects, writing, team, and contact.",
  alternates: { canonical: "/ai" }
}

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/showcase", label: "Showcase" },
  { href: "/people", label: "People" },
  { href: "/blog", label: "Blog" },
  { href: "/lab", label: "Lab" },
  { href: "/contact", label: "Contact" }
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

const linkClass =
  "underline underline-offset-4 transition-colors hover:text-brand-o"

const Section = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => (
  <section className="flex w-full flex-col items-center gap-4">
    <h2 className="uppercase tracking-widest text-brand-g1">{title}</h2>
    {children}
  </section>
)

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

  let introParagraphs = [
    plainText(homepage?.introTitle),
    plainText(homepage?.introSubtitle)
  ].filter(Boolean)
  if (!introParagraphs.length) introParagraphs = [COMPANY_FACTS.description]

  // The no-category posts query intentionally skips the newest post (the blog
  // renders it separately as featured) — merge it back in here.
  const latestPosts = [featuredPost, ...posts]
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .slice(0, 10)

  const openPositions = positions.filter((p) => p.isOpen)

  const socialLinks = [
    { label: "X (Twitter)", url: companyInfo.twitter },
    { label: "Instagram", url: companyInfo.instagram },
    { label: "GitHub", url: companyInfo.github },
    { label: "LinkedIn", url: companyInfo.linkedIn }
  ].filter((s): s is { label: string; url: string } => Boolean(s.url))

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-10 px-4 pb-24 pt-16 text-center text-f-p-mobile text-brand-w2 lg:text-f-p">
      <header className="flex flex-col items-center gap-4">
        <h1 className="text-f-h3-mobile text-brand-w1 lg:text-f-h3">
          basement.studio
        </h1>
        <p>We make cool shit that performs.</p>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={linkClass}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </header>

      <div className="flex flex-col gap-4">
        {introParagraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>

      <Section title="About basement.studio">
        <p>{COMPANY_FACTS.description}</p>
        <p>
          Founded in {COMPANY_FACTS.foundingDate} and based in{" "}
          {COMPANY_FACTS.locationName}, the studio works primarily with
          technology companies in the San Francisco Bay Area and has partnered
          with startups and enterprise brands including{" "}
          {formatFactList(COMPANY_FACTS.notableClients)}.
        </p>
        <p>Services: {formatFactList(COMPANY_FACTS.services)}.</p>
        <p>{COMPANY_FACTS.awardsSummary}</p>
        <p>{COMPANY_FACTS.geistAttribution}</p>
      </Section>

      {homepage?.capabilities?.length ? (
        <Section title="What we do">
          {homepage.capabilities.map((cap) => (
            <div key={cap._id} className="flex flex-col items-center gap-1">
              <h3 className="text-brand-w1">{cap.title}</h3>
              {cap.description ? <p>{cap.description}</p> : null}
              {cap.subcategories?.length ? (
                <p className="text-brand-g1">
                  {cap.subcategories.map((s) => s.title).join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {servicesPage?.ventures?.length ? (
        <Section title="Ventures">
          {servicesPage.ventures.map((venture) => (
            <div
              key={venture._key}
              className="flex flex-col items-center gap-1"
            >
              <h3 className="text-brand-w1">{venture.title}</h3>
              {plainText(venture.content) ? (
                <p>{plainText(venture.content)}</p>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {homepage?.clients?.length ? (
        <Section title="Clients">
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
        <Section title="Selected work">
          <ul className="flex flex-col gap-2">
            {homepage.featuredProjects.map((item) => {
              const label = item.title || item.project?.title || "Untitled"
              const slug = item.project?.slug?.current
              return (
                <li key={item._key}>
                  {slug ? (
                    <a href={`/showcase/${slug}`} className={linkClass}>
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
        <Section title="Showcase">
          <ul className="flex flex-col gap-2">
            {showcaseList.map((project) => {
              const detail = [project.client, project.year]
                .filter(Boolean)
                .join(", ")
              return (
                <li key={project.slug}>
                  <a href={`/showcase/${project.slug}`} className={linkClass}>
                    {project.title}
                  </a>
                  {detail ? ` — ${detail}` : null}
                </li>
              )
            })}
          </ul>
        </Section>
      ) : null}

      {latestPosts.length ? (
        <Section title="Latest writing">
          <ul className="flex flex-col gap-2">
            {latestPosts.map((post) => (
              <li key={post._id}>
                {post.date ? (
                  <span className="text-brand-g1">{post.date} — </span>
                ) : null}
                <a href={`/post/${post.slug}`} className={linkClass}>
                  {post.title}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Open positions">
        {openPositions.length ? (
          <ul className="flex flex-col gap-2">
            {openPositions.map((position) => {
              const detail = [position.type, position.location]
                .filter(Boolean)
                .join(", ")
              return (
                <li key={position.slug}>
                  <a href={`/careers/${position.slug}`} className={linkClass}>
                    {position.title}
                  </a>
                  {detail ? ` — ${detail}` : null}
                </li>
              )
            })}
          </ul>
        ) : (
          <p>No open positions right now.</p>
        )}
      </Section>

      <Section title="Contact">
        <ul className="flex flex-col gap-2">
          {orgData.contactPoints.map((contact) => (
            <li key={contact.email}>
              <span className="text-brand-g1">{contact.contactType}: </span>
              <a href={`mailto:${contact.email}`} className={linkClass}>
                {contact.email}
              </a>
            </li>
          ))}
          <li>
            <a href="/contact" className={linkClass}>
              Start a project →
            </a>
          </li>
        </ul>
      </Section>

      {socialLinks.length ? (
        <Section title="Social">
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {socialLinks.map((social) => (
              <li key={social.label}>
                <a href={social.url} rel="noopener" className={linkClass}>
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="For agents">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2">
          {AGENT_RESOURCES.map((resource) => (
            <li key={resource.href}>
              <a href={resource.href} className={linkClass}>
                {resource.label}
              </a>
            </li>
          ))}
        </ul>
        <p>
          Every page also serves markdown: append <code>.md</code> to a URL or
          request it with <code>Accept: text/markdown</code>.
        </p>
      </Section>

      <footer className="flex flex-col items-center gap-2 text-brand-g1">
        <p>
          © {year} {COMPANY_FACTS.name}
        </p>
        <a href="/" className={linkClass}>
          Back to human site →
        </a>
      </footer>
    </main>
  )
}

export default AiPage
