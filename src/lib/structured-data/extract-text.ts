type RichTextNode = {
  type?: string
  text?: string
  content?: RichTextNode[]
}

export const extractPlainText = (
  content: unknown,
  maxLength?: number
): string => {
  if (!content || !Array.isArray(content)) return ""

  const text = (content as RichTextNode[])
    .flatMap((node) => {
      if (node.type === "text") return node.text ?? ""
      if (node.content) return extractPlainText(node.content)
      return ""
    })
    .join("")
    .trim()

  if (maxLength && text.length > maxLength) {
    return text.slice(0, maxLength).trimEnd() + "..."
  }

  return text
}
