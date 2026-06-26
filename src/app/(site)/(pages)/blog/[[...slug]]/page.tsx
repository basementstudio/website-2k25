import type { Metadata } from "next"

import { BlogList } from "@/components/blog/list"
import { JsonLd } from "@/lib/structured-data/json-ld"
import { generateCollectionPageSchema } from "@/lib/structured-data/schemas/collection"

import { fetchCategoriesNonEmpty, fetchPostListForSchema } from "../sanity"

type Params = Promise<{ slug: string[] }>

const titleCase = (slug: string): string =>
  slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

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
  const label = category?.title ?? titleCase(categorySlug)

  return {
    description: `Explore basement.studio's ${label} articles — deep dives, tutorials, and behind-the-scenes notes from our design and engineering team.`,
    alternates: {
      canonical: `https://basement.studio/blog/${categorySlug}`
    }
  }
}

const BlogIndexPage = async (props: { params: Params }) => {
  const params = await props.params
  const isBlogHome = !params.slug?.[0]

  const collectionSchema = isBlogHome
    ? generateCollectionPageSchema({
        path: "/blog",
        name: "Blog",
        description:
          "Articles, deep dives, and behind-the-scenes notes from the basement.studio team.",
        items: (await fetchPostListForSchema()).map((post) => ({
          name: post.title,
          path: `/post/${post.slug}`
        }))
      })
    : null

  return (
    <>
      {collectionSchema ? <JsonLd data={collectionSchema} /> : null}
      <BlogList params={params} />
    </>
  )
}

// pre build all the categories
export const generateStaticParams = async () => {
  const categories = await fetchCategoriesNonEmpty({ forStaticParams: true })

  categories.unshift({
    title: "Home",
    slug: ""
  })

  return categories.map((category) => ({
    slug: [category.slug]
  }))
}

export default BlogIndexPage
