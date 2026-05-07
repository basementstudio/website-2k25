import type { PortableTextSpan } from "@portabletext/types"

import type { PortableTextBlock } from "@/service/sanity/types"

/**
 * Extracts plain text from an array of Portable Text blocks. Only text spans
 * inside standard `block` nodes are considered — custom block types (images,
 * code, embeds) are ignored. Optionally truncates with an ellipsis.
 */
export const extractPlainText = (
  content: PortableTextBlock[] | null | undefined,
  maxLength?: number
): string => {
  if (!content || !Array.isArray(content)) return ""

  const text = content
    .flatMap((block) => {
      if (block._type !== "block" || !Array.isArray(block.children)) return []
      return block.children
        .filter((child): child is PortableTextSpan => child._type === "span")
        .map((child) => child.text)
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).trimEnd() + "..."
  }

  return text
}
