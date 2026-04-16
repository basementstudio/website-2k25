import type { PortableTextBlock } from "@/service/sanity/types"

interface PortableTextChild {
  _type?: string
  text?: string
}

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
      if (
        !block ||
        typeof block !== "object" ||
        (block as { _type?: string })._type !== "block"
      ) {
        return []
      }
      const children = (block as { children?: PortableTextChild[] }).children
      if (!Array.isArray(children)) return []
      return children
        .filter((child) => child?._type === "span" && typeof child.text === "string")
        .map((child) => child.text ?? "")
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).trimEnd() + "..."
  }

  return text
}
