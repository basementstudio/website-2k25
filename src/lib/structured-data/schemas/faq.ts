import { SITE_URL } from "@/lib/constants"

import { ORGANIZATION_ID } from "./organization"

interface FaqItem {
  question: string
  answer: string
}

export const generateFaqPageSchema = (faqs: FaqItem[]) => ({
  "@type": "FAQPage",
  "@id": `${SITE_URL}/faq#faqpage`,
  name: "Frequently Asked Questions",
  url: `${SITE_URL}/faq`,
  inLanguage: "en",
  about: { "@id": ORGANIZATION_ID },
  publisher: { "@id": ORGANIZATION_ID },
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer
    }
  }))
})
