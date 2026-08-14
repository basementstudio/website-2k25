import type { Metadata } from "next"

import { BlogList } from "@/components/blog/list"
import { PageJsonLd } from "@/lib/structured-data/page-json-ld"
import { generateCollectionPageSchema } from "@/lib/structured-data/schemas/collection"

import {
  fetchCategoriesNonEmpty,
  fetchPostListForSchema,
  fetchPostListForSchemaByCategory
} from "../sanity"

type Params = Promise<{ slug: string[] }>

export const generateMetadata = async (props: {
  params: Params
}): Promise<Metadata> => {
  const { slug } = await props.params
  const categorySlug = slug?.[0]

  if (!categorySlug) {
    return {
      description:
        "Read the basement.studio blog — articles, deep dives, and behind-the-scenes notes on design, branding, web engineering, 3D, and cool shit that performs.",
      alternates: {
        canonical: "https://basement.studio/blog"
      }
    }
  }

  const categories = await fetchCategoriesNonEmpty()
  const category = categories.find((c) => c.slug === categorySlug)

  // Unknown category or extra segments still render (HTML is frozen) — stop
  // them from self-canonicalizing as distinct, indexable URLs.
  if (!category || slug.length > 1) {
    return {
      description:
        "Read the basement.studio blog — articles, deep dives, and behind-the-scenes notes on design, branding, web engineering, 3D, and cool shit that performs.",
      alternates: {
        canonical: "https://basement.studio/blog"
      },
      robots: { index: false }
    }
  }

  return {
    description: `Explore basement.studio's ${category.title} articles — deep dives, tutorials, and behind-the-scenes notes from our design and engineering team.`,
    alternates: {
      canonical: `https://basement.studio/blog/${categorySlug}`
    }
  }
}

export default async function BlogIndexPage(props: { params: Params }) {
  const params = await props.params
  const categorySlug = params.slug?.[0]

  let collectionSchema = null
  if (categorySlug) {
    const [categories, posts] = await Promise.all([
      fetchCategoriesNonEmpty(),
      fetchPostListForSchemaByCategory(categorySlug)
    ])
    // Unknown slugs must not advertise a collection the page doesn't render.
    const category = categories.find((c) => c.slug === categorySlug)
    collectionSchema = category
      ? generateCollectionPageSchema({
          path: `/blog/${categorySlug}`,
          name: `Blog — ${category.title}`,
          description: `${category.title} articles from the basement.studio team.`,
          items: posts.map((post) => ({
            name: post.title,
            path: `/post/${post.slug}`
          }))
        })
      : null
  } else {
    collectionSchema = generateCollectionPageSchema({
      path: "/blog",
      name: "Blog",
      description:
        "Articles, deep dives, and behind-the-scenes notes from the basement.studio team.",
      items: (await fetchPostListForSchema()).map((post) => ({
        name: post.title,
        path: `/post/${post.slug}`
      }))
    })
  }

  return (
    <>
      <PageJsonLd nodes={[collectionSchema]} />
      <BlogList params={params} />
    </>
  )
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty({ forStaticParams: true })

  return [
    { slug: [] },
    ...categories.map((category) => ({ slug: [category.slug] }))
  ]
}
