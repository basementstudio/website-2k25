import { notFound } from "next/navigation"

import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateBlogPostingSchema } from "@/lib/structured-data/schemas/blog-posting"

import { SandPackCSS } from "./components/sandbox/sandpack-styles"
import { Content } from "./content"
import { More } from "./more"
import {
  fetchAllPostSlugs,
  fetchPostBySlug,
  fetchPostMeta,
  fetchRelatedPosts
} from "./sanity"
import { BlogTitle } from "./title"

interface ProjectPostProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-static"

export const generateMetadata = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const post = await fetchPostMeta(slug)

  if (!post) return null

  return {
    title: {
      absolute: `${post.title ?? "Untitled"} | Blog`
    },
    alternates: {
      canonical: `https://basement.studio/post/${slug}`
    }
  }
}

const Blog = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const post = await fetchPostBySlug(slug)

  if (!post) return notFound()

  const relatedPosts = await fetchRelatedPosts(post._id)

  const blogPostingSchema = generateBlogPostingSchema({
    title: post.title,
    slug: post.slug,
    date: post.date,
    createdAt: post._createdAt,
    intro: post.intro,
    heroImage: post.heroImage,
    authors: post.authors,
    categories: post.categories
  })

  return (
    <>
      <JsonLd data={blogPostingSchema} />
      <div className="relative bg-brand-k pt-12 lg:pb-24">
        <div className="lg:pb-25 flex flex-col gap-24">
          <BlogTitle title={post.title} />
          <Content post={post} />
          <More posts={relatedPosts} />
        </div>
      </div>

      {/* SSR CSS for Sandpack when using CodeSandbox */}
      <SandPackCSS />
    </>
  )
}

export async function generateStaticParams() {
  const slugs = await fetchAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default Blog
