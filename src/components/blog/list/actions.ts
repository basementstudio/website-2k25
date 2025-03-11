"use server"

import { fetchPosts } from "@/app/(pages)/blog/basehub"

const POSTS_PER_PAGE = 10

export async function getPosts(nextPage: number, category?: string) {
  const { posts, total } = await fetchPosts(
    (nextPage - 1) * POSTS_PER_PAGE,
    POSTS_PER_PAGE,
    category
  )

  const remainingPosts = total - posts.length

  return { posts, nextPage, remainingPosts }
}
