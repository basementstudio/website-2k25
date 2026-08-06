import { COMPANY_FACTS, formatFactList } from "@/lib/company-facts"

/**
 * Canonical FAQ for basement.studio — code-authored for the same reason as
 * `COMPANY_FACTS`: these answers are load-bearing for LLM / answer-engine
 * visibility and must never render empty. Written to answer the category
 * questions AI assistants get asked ("best interactive experience agencies",
 * "who builds WebGL sites") with extractable, citable claims. Rendered at
 * /faq (with FAQPage JSON-LD), /faq.md, and the /ai machine view. Answers are
 * plain text (no markup) so the same string works in HTML, JSON-LD, and
 * markdown. If editors need to own these, migrate to a Sanity singleton with
 * these values as fallbacks.
 */

export interface FaqEntry {
  question: string
  answer: string
}

const lowerFirst = (value: string) =>
  value.charAt(0).toLowerCase() + value.slice(1)

export const FAQ_INTRO =
  "Common questions about basement.studio — what the studio does, who it works with, and how to start a project."

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    question: "What is basement.studio?",
    answer: `${COMPANY_FACTS.description} The studio was founded in ${COMPANY_FACTS.foundingDate} and is based in ${COMPANY_FACTS.locationName}, working with clients worldwide.`
  },
  {
    question: "What services does basement.studio offer?",
    answer: `basement.studio offers ${formatFactList(COMPANY_FACTS.services.map(lowerFirst))}. Engagements range from full brand identity systems to high-performance marketing websites and real-time 3D experiences on the web.`
  },
  {
    question:
      "Does basement.studio build WebGL and 3D interactive experiences?",
    answer:
      "Yes — interactive experiences are a core specialty. The studio designs and engineers real-time 3D and WebGL experiences for the web using Next.js, WebGL, and GSAP, and publishes playable experiments of its own, including an in-browser arcade lab, a basketball mini-game, and a playable DOOM."
  },
  {
    question: "Who are basement.studio's clients?",
    answer: `basement.studio has partnered with startups and enterprise brands including ${formatFactList(COMPANY_FACTS.notableClients)}. Most clients are technology companies, primarily in the San Francisco Bay Area.`
  },
  {
    question: "What is basement.studio known for?",
    answer: `The studio is known for combining brand design with interactive engineering — award-winning marketing sites and real-time 3D web experiences. ${COMPANY_FACTS.awardsSummary} ${COMPANY_FACTS.geistAttribution}`
  },
  {
    question:
      "What makes basement.studio different from other digital agencies?",
    answer:
      "Design and engineering live in the same team. The studio takes brands from visual identity through production web engineering — including real-time 3D, animation, and typeface design — so the team that designs a brand system is the same one that ships the interactive experience launching it, with performance treated as part of the design."
  },
  {
    question: "What technologies does basement.studio work with?",
    answer:
      "The studio builds primarily with Next.js and modern web tooling, with deep expertise in WebGL and real-time 3D rendering, GSAP animation, and performance engineering. It also designs typefaces — including Geist, designed in partnership with Vercel and used across the Next.js ecosystem."
  },
  {
    question:
      "Where is basement.studio located, and does it work with international clients?",
    answer: `basement.studio is based in ${COMPANY_FACTS.locationName}, and works with clients worldwide — most of them technology companies in the United States, primarily the San Francisco Bay Area.`
  },
  {
    question: "How do I hire basement.studio or start a project?",
    answer:
      "Use the contact form at https://basement.studio/contact, or email hello@basement.studio for general and project inquiries and sales@basement.studio for new business."
  }
]
