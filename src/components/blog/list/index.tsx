import { fetchCategoriesNonEmpty, fetchPosts } from "@/app/(pages)/blog/basehub"

import { BlogListClient } from "./client"

const POSTS_PER_PAGE = 10

export const BlogList = async ({ params }: { params: { slug: string[] } }) => {
  const { posts, total } = await fetchPosts(
    0,
    POSTS_PER_PAGE,
    params.slug ? params.slug[0] : undefined
  )

  return <BlogListClient initialPosts={posts} total={total} params={params} />
}
