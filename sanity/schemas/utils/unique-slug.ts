import type { SlugValidationContext } from "sanity"

import { apiVersion } from "../../env"

// Per-type slug uniqueness for a slug field's `options.isUnique`. Counts other
// documents of the same type sharing the slug, ignoring the current doc's
// published+draft pair so editing in place doesn't flag itself. Sanity's
// built-in slug validator calls this and blocks publish when it returns false.
export async function isSlugUniqueForType(
  slug: string,
  context: SlugValidationContext
): Promise<boolean> {
  const { document, getClient } = context
  const type = document?._type
  const id = document?._id?.replace(/^drafts\./, "")

  if (!slug || !type || !id) return true

  const client = getClient({ apiVersion })
  const count = await client.fetch<number>(
    `count(*[
      _type == $type &&
      !(_id in [$id, "drafts." + $id]) &&
      slug.current == $slug
    ])`,
    { type, id, slug }
  )

  return count === 0
}
