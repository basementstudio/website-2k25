import { FAQ_FALLBACK, type FaqEntry, type FaqPageContent } from "@/lib/faq"
import { sanityFetchCached } from "@/service/sanity"

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

const isCompleteEntry = (entry: {
  question: string | null
  answer: string | null
}): entry is FaqEntry => Boolean(entry.question && entry.answer)

// Every field falls back individually: these answers are load-bearing for
// answer-engine visibility and must never render empty.
const withFallback = (doc: FaqPageDocument | null): FaqPageContent => {
  const entries = doc?.entries?.filter(isCompleteEntry) ?? []

  return {
    metaTitle: doc?.metaTitle || FAQ_FALLBACK.metaTitle,
    metaDescription: doc?.metaDescription || FAQ_FALLBACK.metaDescription,
    heading: doc?.heading || FAQ_FALLBACK.heading,
    intro: doc?.intro || FAQ_FALLBACK.intro,
    entries: entries.length ? entries : FAQ_FALLBACK.entries
  }
}

export async function fetchFaqPage(
  /** Pass `published: true` for non-draft contexts (`generateMetadata`, the `.md` endpoint) — disables stega so output isn't polluted with invisible chars. */
  options?: { published?: boolean }
): Promise<FaqPageContent> {
  try {
    const doc = await sanityFetchCached<FaqPageDocument | null>({
      query: faqPageQuery,
      ...(options?.published ? { perspective: "published" as const } : {})
    })
    return withFallback(doc)
  } catch (error) {
    console.error("Failed to fetch FAQ content; using fallback", error)
    return FAQ_FALLBACK
  }
}
