import 'dotenv/config'
import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import {
  convertRichText,
  sanitizePortableText,
  filterIntroBlocks,
  sanitizeDocument,
  type BaseHubBlock,
} from './utils/rich-text'

/**
 * Re-migrate all blog posts with fixed rich text converter and missing persons.
 *
 * Run standalone: pnpm exec tsx scripts/migration/fix-posts.ts
 */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function fetchExistingIds(type: string): Promise<Set<string>> {
  const docs: Array<{ _id: string }> = await sanityWriteClient.fetch(
    `*[_type == "${type}"]{ _id }`
  )
  return new Set(docs.map((d) => d._id))
}

/**
 * Retry wrapper for image downloads with timeout and exponential backoff.
 * Returns null on failure instead of throwing.
 */
async function safeDownloadAndUploadImage(
  url: string | undefined | null,
  filename?: string,
  retries = 3
): Promise<Awaited<ReturnType<typeof downloadAndUploadImage>> | null> {
  if (!url) return null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        downloadAndUploadImage(url, filename),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Image download timeout (30s)')), 30000)
        ),
      ])
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < retries) {
        const delay = attempt * 2000
        console.log(`    [retry ${attempt}/${retries}] Image failed: ${msg}. Retrying in ${delay}ms...`)
        await new Promise((r) => setTimeout(r, delay))
      } else {
        console.log(`    [skip] Image failed after ${retries} attempts: ${msg}`)
        return null
      }
    }
  }
  return null
}

/**
 * Normalize BaseHub's polymorphic block array into a flat array with __typename and _id.
 */
function normalizeBlocks(rawBlocks: unknown[]): BaseHubBlock[] {
  const blocks: BaseHubBlock[] = []

  for (const raw of rawBlocks) {
    if (!raw || typeof raw !== 'object') continue
    const block = raw as Record<string, unknown>

    const typename = block.__typename as string
    if (!typename) continue

    // Case 1: Block data is already flat
    if (block._id) {
      blocks.push(block as unknown as BaseHubBlock)
      continue
    }

    // Case 2: Block data is nested under on_<TypeName> key
    const nestedKey = `on_${typename}`
    const nested = block[nestedKey] as Record<string, unknown> | undefined
    if (nested && typeof nested === 'object' && nested._id) {
      blocks.push({
        ...nested,
        __typename: typename,
      } as unknown as BaseHubBlock)
      continue
    }

    // Case 3: Try all on_* keys as fallback
    for (const key of Object.keys(block)) {
      if (key.startsWith('on_') && block[key] && typeof block[key] === 'object') {
        const candidate = block[key] as Record<string, unknown>
        if (candidate._id) {
          blocks.push({
            ...candidate,
            __typename: (candidate.__typename as string) || typename,
          } as unknown as BaseHubBlock)
          break
        }
      }
    }
  }

  return blocks
}

async function migratePostCategories() {
  console.log('\n--- Post Categories ---')
  console.log('  Fetching post categories from BaseHub...')

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
  const errors: Array<{ id: string; error: string }> = []

  for (const cat of categories) {
    const slug = cat._slug || slugify(cat._title)
    const docId = `postCategory-${slug}`
    try {
      await sanityWriteClient.createOrReplace({
        _id: docId,
        _type: 'postCategory',
        title: cat._title,
        slug: { _type: 'slug', current: slug },
      })
      count++
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`)
    for (const e of errors) console.log(`    - ${e.id}: ${e.error}`)
  }
  console.log(`  Created ${count} post categories`)
  return count
}

async function migratePosts(
  existingPersons: Set<string>,
  existingCategories: Set<string>
) {
  console.log('\n--- Blog Posts ---')
  console.log('  Fetching blog posts from BaseHub...')

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
  let refsSkipped = 0
  const errors: Array<{ id: string; error: string }> = []

  for (const post of posts) {
    const slug = post._slug || slugify(post._title)
    const docId = `post-${slug}`
    console.log(`  Processing: ${post._title}`)

    try {
      // Hero image (non-fatal if download fails)
      let heroImage = undefined
      if (post.hero?.heroImage?.url) {
        heroImage = await safeDownloadAndUploadImage(
          post.hero.heroImage.url,
          `${slug}-hero`
        )
      }

      // Hero video URL
      const heroVideo = post.hero?.heroVideo?.url || undefined

      // Category references — verify each exists
      const categories: Array<{
        _key: string
        _type: 'reference'
        _ref: string
      }> = []
      for (const c of post.categories || []) {
        if (!c._title) continue
        const catSlug = c._slug || slugify(c._title)
        const catId = `postCategory-${catSlug}`
        if (existingCategories.has(catId)) {
          categories.push({
            _key: slugify(c._title),
            _type: 'reference' as const,
            _ref: catId,
          })
        } else {
          console.log(`    ⚠ Category ref skipped: ${catId} not found`)
          refsSkipped++
        }
      }

      // Author references — verify each exists
      const authors: Array<{
        _key: string
        _type: 'reference'
        _ref: string
      }> = []
      for (const a of post.authors || []) {
        if (!a._title) continue
        const authorSlug = a._slug || slugify(a._title)
        const authorId = `person-${authorSlug}`
        if (existingPersons.has(authorId)) {
          authors.push({
            _key: slugify(a._title),
            _type: 'reference' as const,
            _ref: authorId,
          })
        } else {
          console.log(`    ⚠ Author ref skipped: ${authorId} not found`)
          refsSkipped++
        }
      }

      // Convert intro rich text — only basic block types
      // Wrapped in try/catch so rich text conversion failures don't block the post
      let sanitizedIntro: Array<Record<string, unknown>> = []
      let sanitizedContent: Array<Record<string, unknown>> = []

      try {
        const introRaw = await convertRichText(post.intro?.json?.content)
        const intro = filterIntroBlocks(introRaw)
        sanitizedIntro = sanitizePortableText(
          intro as Array<Record<string, unknown>>,
          new Set(['block'])
        ) as Array<Record<string, unknown>>
      } catch (introErr) {
        const msg = introErr instanceof Error ? introErr.message : String(introErr)
        console.log(`    [warn] Intro conversion failed, skipping intro: ${msg}`)
      }

      try {
        // Normalize blocks from json.blocks for the rich text converter
        const rawBlocks = post.content?.json?.blocks || []
        const normalizedBlocks: BaseHubBlock[] = normalizeBlocks(rawBlocks)

        // Convert content rich text with custom blocks
        const content = await convertRichText(
          post.content?.json?.content,
          normalizedBlocks
        )

        // Sanitize content portable text
        sanitizedContent = sanitizePortableText(
          content as Array<Record<string, unknown>>
        ) as Array<Record<string, unknown>>
      } catch (contentErr) {
        const msg = contentErr instanceof Error ? contentErr.message : String(contentErr)
        console.log(`    [warn] Content conversion failed, skipping content: ${msg}`)
      }

      // Post date — required by schema
      const date =
        post.date || post._sys?.createdAt || new Date(0).toISOString()

      const doc: Record<string, unknown> = {
        _id: docId,
        _type: 'post',
        title: post._title,
        slug: { _type: 'slug', current: slug },
        date,
        ...(categories.length > 0 ? { categories } : {}),
        ...(authors.length > 0 ? { authors } : {}),
        ...(heroImage ? { heroImage } : {}),
        ...(heroVideo ? { heroVideo } : {}),
        ...(sanitizedIntro.length > 0 ? { intro: sanitizedIntro } : {}),
        ...(sanitizedContent.length > 0
          ? { content: sanitizedContent }
          : {}),
      }

      // Run full document sanitization
      const { doc: sanitizedDoc, warnings } = sanitizeDocument(doc)
      for (const w of warnings) {
        console.log(`    [warn] ${w}`)
      }

      try {
        await sanityWriteClient.createOrReplace(
          sanitizedDoc as Parameters<typeof sanityWriteClient.createOrReplace>[0]
        )
        count++
        console.log(`  + ${docId}`)
      } catch (sanityErr) {
        // On validation failure, log details and retry without content
        const sanityMsg = sanityErr instanceof Error ? sanityErr.message : String(sanityErr)
        console.log(`    [debug] createOrReplace failed: ${sanityMsg}`)
        console.log(`    [debug] Content blocks: ${sanitizedContent.length}, types: ${
          sanitizedContent.map((b) => b._type).join(', ')
        }`)
        console.log(`    [debug] Intro blocks: ${sanitizedIntro.length}`)
        console.log(`    [debug] Doc keys: ${Object.keys(sanitizedDoc).join(', ')}`)

        // Log sample of content blocks for inspection
        for (const block of sanitizedContent.slice(0, 2)) {
          console.log(`    [debug] sample: ${JSON.stringify(block).slice(0, 200)}`)
        }

        console.log(`    [fallback] Retrying without rich text content...`)

        // Strip content and intro to create a basic post
        const fallbackDoc = {
          _id: docId,
          _type: 'post' as const,
          title: post._title,
          slug: { _type: 'slug' as const, current: slug },
          date,
          ...(categories.length > 0 ? { categories } : {}),
          ...(authors.length > 0 ? { authors } : {}),
          ...(heroImage ? { heroImage } : {}),
          ...(heroVideo ? { heroVideo } : {}),
        }

        try {
          await sanityWriteClient.createOrReplace(fallbackDoc)
          count++
          console.log(`  + ${docId} (without rich text content)`)
        } catch (fallbackErr) {
          const fallbackMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
          console.error(`  ! Failed ${docId} even without content: ${fallbackMsg}`)
          errors.push({ id: docId, error: `Fallback also failed: ${fallbackMsg}` })
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ! Failed ${docId}: ${msg}`)
      errors.push({ id: docId, error: msg })
    }
  }

  if (errors.length > 0) {
    console.log(`\n  ⚠ ${errors.length} posts failed:`)
    for (const e of errors) {
      console.log(`    - ${e.id}: ${e.error}`)
    }
  }

  console.log(
    `\n  Created ${count}/${posts.length} posts, ${refsSkipped} references skipped`
  )
  return { count, total: posts.length, errors: errors.length, refsSkipped }
}

export default async function fixPosts() {
  console.log('=== Fix Posts ===\n')

  // Pre-fetch existing documents for reference validation
  console.log('  Loading existing documents for reference validation...')
  const [existingPersons, existingCategories] = await Promise.all([
    fetchExistingIds('person'),
    fetchExistingIds('postCategory'),
  ])
  console.log(
    `  Persons: ${existingPersons.size}, Post categories: ${existingCategories.size}`
  )

  // Step 1: Ensure post categories exist
  const catCount = await migratePostCategories()

  // Refresh categories after creation
  const refreshedCategories = await fetchExistingIds('postCategory')

  // Step 2: Migrate all posts
  const result = await migratePosts(existingPersons, refreshedCategories)

  // Summary
  console.log('\n=== Summary ===')
  console.log(`  Post categories: ${catCount}`)
  console.log(`  Posts created: ${result.count}/${result.total}`)
  console.log(`  Posts failed: ${result.errors}`)
  console.log(`  References skipped: ${result.refsSkipped}`)
  console.log('=== Done ===')

  return result
}

fixPosts()
  .then((result) => {
    if (result.errors > 0) {
      console.log(
        `\n⚠ ${result.errors} posts failed. Check logs above for details.`
      )
    }
    console.log(`\n${result.count}/${result.total} posts created.`)
    process.exit(0)
  })
  .catch((err) => {
    console.error('fix-posts failed:', err)
    process.exit(1)
  })
