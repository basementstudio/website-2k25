import { notFound } from "next/navigation"

import { extractPlainText } from "@/lib/structured-data/extract-text"
import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateBlogPostingSchema } from "@/lib/structured-data/schemas/blog-posting"
import { generateBreadcrumbSchema } from "@/lib/structured-data/schemas/breadcrumb"
import { truncateDescription } from "@/utils/seo"

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

export const generateMetadata = async ({ params }: ProjectPostProps) => {
  const { slug } = await params
  const post = await fetchPostMeta(slug)

  if (!post) return null

  const title = post.title ?? "Untitled"
  const description =
    truncateDescription(extractPlainText(post.intro)) ||
    `Read ${title} on the basement.studio blog — insights on design, engineering, and building cool shit that performs.`

  return {
    title: {
      absolute: `${title} | Blog`
    },
    description,
    alternates: {
      canonical: `https://basement.studio/post/${slug}`
    }
  }
}

async function getPostData(slug: string) {
  "use cache"
  const post = await fetchPostBySlug(slug)

  if (!post) return null

  const relatedPosts = await fetchRelatedPosts(
    post.slug,
    post.categories?.map((category) => category.title) ?? []
  )

  return { post, relatedPosts }
}

export default async function Blog({ params }: ProjectPostProps) {
  const { slug } = await params
  const data = await getPostData(slug)

  if (!data) return notFound()

  const { post, relatedPosts } = data

  const blogPostingSchema = generateBlogPostingSchema({
    title: post.title,
    slug: post.slug,
    date: post.date,
    modifiedAt: post._updatedAt,
    intro: post.intro,
    heroImage: post.heroImage,
    authors: post.authors,
    categories: post.categories
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title ?? "Untitled", path: `/post/${post.slug}` }
  ])

  return (
    <>
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
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
