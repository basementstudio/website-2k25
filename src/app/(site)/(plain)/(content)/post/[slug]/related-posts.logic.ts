import type { RelatedPost } from "./sanity"

interface SelectRelatedPostsArgs {
  posts: RelatedPost[]
  currentSlug: string
  currentCategoryTitles: string[]
}

export function selectRelatedPosts({
  posts,
  currentSlug,
  currentCategoryTitles
}: SelectRelatedPostsArgs): RelatedPost[] {
  if (currentCategoryTitles.length === 0) {
    return []
  }

  return posts
    .filter((post) =>
      post.categories?.some((category) =>
        currentCategoryTitles.includes(category.title)
      )
    )
    .filter((post) => post.slug !== currentSlug)
    .slice(0, 3)
}
