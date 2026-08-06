import { ORGANIZATION_ID } from "./organization"

const SITE_URL = "https://basement.studio"

interface FaqItem {
  question: string
  answer: string
}

export const generateFaqPageSchema = (faqs: FaqItem[]) => ({
  "@context": "https://schema.org",
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
