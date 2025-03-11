import { fragmentOn } from "basehub"

import { client } from "@/service/basehub"

const ImageFragment = fragmentOn("BlockImage", {
  url: true,
  width: true,
  height: true,
  alt: true
})

const CodeBlockFragment = fragmentOn("CodeBlockComponent", {
  __typename: true,
  _id: true,
  files: {
    items: {
      _id: true,
      _title: true,
      codeSnippet: {
        code: true,
        language: true
      }
    }
  }
})

const QuoteWithAuthorFragment = fragmentOn("QuoteWithAuthorComponent", {
  __typename: true,
  _id: true,

  quote: {
    json: {
      content: true
    }
  },
  author: true,
  role: true,
  avatar: ImageFragment
})

const CodeSandboxFragment = fragmentOn("CodeSandboxComponent", {
  __typename: true,
  _id: true,
  _title: true,
  sandboxKey: true
})

const SideNoteFragment = fragmentOn("SideNoteComponent", {
  __typename: true,
  _id: true,

  content: {
    json: {
      content: true
    }
  }
})

const TweetFragment = fragmentOn("TweetComponent", {
  __typename: true,
  _id: true,
  tweetId: true
})

const components = {
  on_CodeBlockComponent: CodeBlockFragment,
  on_QuoteWithAuthorComponent: QuoteWithAuthorFragment,
  on_CodeSandboxComponent: CodeSandboxFragment,
  on_SideNoteComponent: SideNoteFragment,
  on_TweetComponent: TweetFragment
}

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

const AuthorFragment = fragmentOn("AuthorComponent", {
  _id: true,
  _title: true,
  _slug: true
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

export const fetchPosts = async (
  skip?: number,
  take?: number,
  category?: string
) => {
  const posts = await client().query({
    pages: {
      blog: {
        posts: {
          items: {
            ...PostFragment
          },
          __args: {
            ...(skip !== undefined && { skip }),
            ...(take !== undefined && { first: take }),
            filter: {
              ...(category && {
                categories: {
                  _slug: { eq: category }
                }
              })
            },
            orderBy: "date__DESC"
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
  const posts = await client().query({
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
  const categories = await client().query({
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
  const res = await client().query({
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
