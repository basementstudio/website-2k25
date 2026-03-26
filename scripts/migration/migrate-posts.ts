import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import { convertRichText, type BaseHubBlock } from './utils/rich-text'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function migratePostCategories() {
  console.log('  Fetching post categories...')

  const data = await basehubClient.query({
    pages: {
      blog: {
        categories: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
          },
        },
      },
    },
  })

  const categories = data.pages.blog.categories.items
  console.log(`  Found ${categories.length} post categories`)

  let count = 0
  for (const cat of categories) {
    const slug = cat._slug || slugify(cat._title)

    await sanityWriteClient.createOrReplace({
      _id: `postCategory-${slug}`,
      _type: 'postCategory',
      title: cat._title,
      slug: { _type: 'slug', current: slug },
    })
    count++
  }

  console.log(`  Created ${count} post category documents`)
  return count
}

async function migratePosts() {
  console.log('  Fetching blog posts...')

  const data = await basehubClient.query({
    pages: {
      blog: {
        posts: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            _sys: {
              createdAt: true,
            },
            date: true,
            intro: {
              json: { content: true },
            },
            categories: {
              _title: true,
              _slug: true,
            },
            authors: {
              _title: true,
              _slug: true,
            },
            content: {
              json: {
                content: true,
                blocks: {
                  __typename: true,
                  on_CodeBlockComponent: {
                    __typename: true,
                    _id: true,
                    files: {
                      items: {
                        _id: true,
                        _title: true,
                        codeSnippet: {
                          code: true,
                          language: true,
                        },
                      },
                    },
                  },
                  on_QuoteWithAuthorComponent: {
                    __typename: true,
                    _id: true,
                    quote: {
                      json: { content: true },
                    },
                    author: true,
                    role: true,
                    avatar: {
                      url: true,
                      alt: true,
                      width: true,
                      height: true,
                    },
                  },
                  on_CodeSandboxComponent: {
                    __typename: true,
                    _id: true,
                    _title: true,
                    sandboxKey: true,
                  },
                  on_SideNoteComponent: {
                    __typename: true,
                    _id: true,
                    content: {
                      json: { content: true },
                    },
                  },
                  on_GridGalleryComponent: {
                    __typename: true,
                    _id: true,
                    images: {
                      items: {
                        image: {
                          on_BlockImage: {
                            url: true,
                            width: true,
                            height: true,
                            alt: true,
                          },
                        },
                      },
                    },
                    caption: true,
                  },
                  on_TweetComponent: {
                    __typename: true,
                    _id: true,
                    tweetId: true,
                  },
                },
              },
            },
            hero: {
              heroImage: {
                url: true,
                alt: true,
                width: true,
                height: true,
              },
              heroVideo: {
                url: true,
              },
            },
          },
        },
      },
    },
  })

  const posts = data.pages.blog.posts.items
  console.log(`  Found ${posts.length} blog posts`)

  let count = 0
  for (const post of posts) {
    const slug = post._slug || slugify(post._title)
    console.log(`    Migrating post: ${post._title}`)

    // Hero image
    let heroImage = undefined
    if (post.hero?.heroImage?.url) {
      heroImage = await downloadAndUploadImage(
        post.hero.heroImage.url,
        `${slug}-hero`
      )
    }

    // Hero video URL
    const heroVideo = post.hero?.heroVideo?.url || undefined

    // Category references
    const categories = (post.categories || [])
      .filter((c: { _title?: string }) => c._title)
      .map((c: { _slug?: string; _title?: string }) => ({
        _key: slugify(c._title || ''),
        _type: 'reference' as const,
        _ref: `postCategory-${c._slug || slugify(c._title || '')}`,
      }))

    // Author references (people)
    const authors = (post.authors || [])
      .filter((a: { _title?: string }) => a._title)
      .map((a: { _slug?: string; _title?: string }) => ({
        _key: slugify(a._title || ''),
        _type: 'reference' as const,
        _ref: `person-${a._slug || slugify(a._title || '')}`,
      }))

    // Convert intro rich text
    const intro = await convertRichText(post.intro?.json?.content)

    // Normalize blocks from json.blocks for the rich text converter
    const rawBlocks = post.content?.json?.blocks || []
    const normalizedBlocks: BaseHubBlock[] = normalizeBlocks(rawBlocks)

    // Convert content rich text with custom blocks
    const content = await convertRichText(
      post.content?.json?.content,
      normalizedBlocks
    )

    // Post date
    const date = post.date || post._sys?.createdAt || undefined

    await sanityWriteClient.createOrReplace({
      _id: `post-${slug}`,
      _type: 'post',
      title: post._title,
      slug: { _type: 'slug', current: slug },
      date,
      ...(categories.length > 0 ? { categories } : {}),
      ...(authors.length > 0 ? { authors } : {}),
      ...(heroImage ? { heroImage } : {}),
      ...(heroVideo ? { heroVideo } : {}),
      ...(intro.length > 0 ? { intro } : {}),
      ...(content.length > 0 ? { content } : {}),
    })
    count++
  }

  console.log(`  Created ${count} post documents`)
  return count
}

/**
 * Normalize BaseHub's polymorphic block array into a flat array with __typename and _id.
 * BaseHub returns blocks as a union with on_<TypeName> wrappers.
 */
function normalizeBlocks(rawBlocks: unknown[]): BaseHubBlock[] {
  const blocks: BaseHubBlock[] = []

  for (const raw of rawBlocks) {
    if (!raw || typeof raw !== 'object') continue
    const block = raw as Record<string, unknown>

    const typename = block.__typename as string
    if (!typename) continue

    // The block data might be nested under on_<TypeName> or flat
    // BaseHub SDK typically returns the discriminated union data directly
    if (block._id) {
      // Block data is already flat (BaseHub SDK resolved the union)
      blocks.push(block as unknown as BaseHubBlock)
    }
  }

  return blocks
}

export default async function migratePostsAll() {
  const catCount = await migratePostCategories()
  const postCount = await migratePosts()
  console.log(
    `  Summary: ${catCount} post categories, ${postCount} posts migrated`
  )
}
