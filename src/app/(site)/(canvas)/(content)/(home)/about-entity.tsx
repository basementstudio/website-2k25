import { Link } from "@/components/primitives/link"
import { COMPANY_FACTS, formatFactList } from "@/lib/company-facts"

/**
 * Plain-text entity block for LLMs and answer engines. The homepage is
 * otherwise visual-first (canvas, galleries), which leaves crawlers almost no
 * prose to cite — this section states who the studio is in crawlable HTML.
 * Visually quiet is fine; hidden is not (display:none / sr-only reads as
 * cloaking to crawlers).
 */
export const AboutEntity = () => (
  <section aria-label="About basement.studio" className="grid-layout">
    <h2 className="col-span-full mb-2 text-f-h3-mobile text-brand-g1 lg:col-start-2 lg:text-f-h3 2xl:col-start-3">
      About basement.studio
    </h2>

    <div className="col-span-full flex flex-col gap-y-4 text-f-p-mobile text-brand-w2 lg:col-start-2 lg:col-end-10 lg:text-f-p 2xl:col-start-3">
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
      <p>
        Explore our{" "}
        <Link href="/services">
          <span className="actionable">services</span>
        </Link>{" "}
        and{" "}
        <Link href="/showcase">
          <span className="actionable">selected work</span>
        </Link>
        .
      </p>
    </div>
  </section>
)
