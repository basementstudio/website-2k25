import { sanityFetchCached } from "@/service/sanity"

export interface FaqEntry {
  question: string
  answer: string
}

export interface FaqPageContent {
  metaTitle: string | null
  metaDescription: string | null
  heading: string | null
  intro: string | null
  entries: FaqEntry[]
}

interface FaqPageDocument {
  metaTitle: string | null
  metaDescription: string | null
  heading: string | null
  intro: string | null
  entries: Array<{ question: string | null; answer: string | null }> | null
}

const faqPageQuery = /* groq */ `
  *[_type == "faqPage"][0]{
    metaTitle,
    metaDescription,
    heading,
    intro,
    entries[]{
      question,
      answer
    }
  }
`

// A half-filled entry would emit an invalid FAQPage Question node — drop it.
const isCompleteEntry = (entry: {
  question: string | null
  answer: string | null
}): entry is FaqEntry => Boolean(entry.question && entry.answer)

export async function fetchFaqPage(): Promise<FaqPageContent | null> {
  const doc = await sanityFetchCached<FaqPageDocument | null>({
    query: faqPageQuery,
    tag: "faq.page"
  })

  if (!doc) return null

  return {
    metaTitle: doc.metaTitle,
    metaDescription: doc.metaDescription,
    heading: doc.heading,
    intro: doc.intro,
    entries: doc.entries?.filter(isCompleteEntry) ?? []
  }
}
