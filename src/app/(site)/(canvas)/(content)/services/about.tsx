import { COMPANY_FACTS, formatFactList } from "@/lib/company-facts"

// The one place the canonical company facts render as human-facing HTML.
// The /ai machine view and the .md mirrors carry the same copy, but answer
// engines weigh prose on regular crawlable pages — /about redirects here.
export const AboutStudio = () => (
  <section className="grid-layout !gap-y-2">
    <h2 className="col-span-full text-f-h3-mobile text-brand-g1 lg:text-f-h3">
      About the studio
    </h2>
    <hr className="col-span-full -mt-px border-brand-w1/30" />
    <div className="col-span-full flex flex-col gap-4 text-f-h4-mobile text-brand-w2 lg:col-start-1 lg:col-end-9 lg:text-f-h4">
      <p>{COMPANY_FACTS.description}</p>
      <p>
        Founded in {COMPANY_FACTS.foundingDate} in {COMPANY_FACTS.locationName},
        the studio has partnered with startups and enterprise brands including{" "}
        {formatFactList(COMPANY_FACTS.notableClients)}.
      </p>
      <p>
        {COMPANY_FACTS.awardsSummary} {COMPANY_FACTS.geistAttribution}
      </p>
    </div>
  </section>
)
