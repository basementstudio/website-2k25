import { basehub, fragmentOn } from "basehub"

const HeroFragment = fragmentOn("HeroComponent", {
  heroVideo: {
    url: true
  },
  heroImage: {
    url: true,
    blurDataURL: true,
    alt: true,
    width: true,
    height: true
  }
})

const PostFragment = fragmentOn("PostsItem", {
  _id: true,
  _title: true,
  _slug: true,
  slug: true,
  categories: {
    _title: true
  },
  date: true,
  intro: {
    json: {
      content: true
    }
  },
  hero: HeroFragment
})

export type Post = fragmentOn.infer<typeof PostFragment>

export const fetchPosts = async (category?: string) => {
  const posts = await basehub().query({
    pages: {
      blog: {
        posts: {
          __args: {
            filter: {
              ...(category && {
                categories: {
                  _slug: { eq: category }
                }
              })
            },
            ...(!category && { skip: 1 }),
            orderBy: "date__DESC"
          },
          items: {
            ...PostFragment
          },
          _meta: {
            filteredCount: true
          }
        }
      }
    }
  })

  return {
    posts: posts.pages.blog.posts.items,
    total: posts.pages.blog.posts._meta.filteredCount
  }
}

export const fetchFeaturedPost = async () => {
  const posts = await basehub().query({
    pages: {
      blog: {
        posts: {
          item: { ...PostFragment },
          __args: {
            first: 1,
            orderBy: "date__DESC"
          }
        }
      }
    }
  })

  return posts.pages.blog.posts.item
}

export const fetchCategories = async () => {
  const categories = await basehub().query({
    pages: {
      blog: {
        categories: {
          items: {
            _title: true,
            _slug: true
          }
        }
      }
    }
  })

  return categories.pages.blog.categories.items
}

export const fetchCategoriesNonEmpty = async () => {
  const res = await basehub().query({
    pages: {
      blog: {
        posts: {
          items: {
            categories: {
              _title: true,
              _slug: true
            }
          }
        }
      }
    }
  })

  const categories = res.pages.blog.posts.items.flatMap((post) =>
    post.categories?.map((c) => ({ _title: c._title, _slug: c._slug }))
  )

  const uniqueCategories = Array.from(
    new Map(categories.map((c) => [c?._slug, c])).values()
  )

  return uniqueCategories.filter((c) => c !== undefined)
}
