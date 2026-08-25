import { stegaClean } from "next-sanity"

import { normalizeHref } from "@/utils/seo"

import { getImageUrl } from "./helpers"
import type { PortableTextBlock, SanityImage, SanityMuxVideo } from "./types"

interface MarkDef {
  _key: string
  _type: string
  href?: string
}

interface Span {
  _type: "span"
  text?: string
  marks?: string[]
}

interface TextBlock {
  _type: "block"
  style?: string
  listItem?: "bullet" | "number"
  level?: number
  children?: Span[]
  markDefs?: MarkDef[]
}

interface CodeBlockValue {
  files?: Array<{ title?: string; code?: string; language?: string }>
}

interface QuoteValue {
  quote?: PortableTextBlock[]
  author?: string
  role?: string
}

interface SideNoteValue {
  content?: PortableTextBlock[]
}

interface GalleryValue {
  images?: SanityImage[]
  caption?: string
}

interface VideoValue {
  videoUrl?: string
  muxVideo?: SanityMuxVideo | null
  caption?: string
}

// Marks that are inline decorators rather than references into `markDefs`.
const DECORATORS = new Set([
  "strong",
  "em",
  "code",
  "underline",
  "strike-through"
])

interface Options {
  /** Used to absolutize root-relative link hrefs (e.g. `/post/x` → `https://…/post/x`). */
  baseUrl?: string
}

/**
 * Converts Sanity Portable Text (including this project's custom blocks) into
 * plain Markdown. Mirrors the block/mark coverage of the blog post renderer in
 * `post/[slug]/content.tsx` so the `.md` output matches what readers see.
 */
export function portableTextToMarkdown(
  blocks: PortableTextBlock[] | null | undefined,
  opts?: Options
): string {
  if (!blocks?.length) return ""

  // Draft-mode callers no longer pin `perspective: "published"`, so guard
  // against stega chars leaking into this crawler-facing markdown output.
  const cleanBlocks = stegaClean(blocks)

  const pieces: Array<{ isListItem: boolean; md: string }> = []
  for (const block of cleanBlocks) {
    const md = renderBlock(block, opts?.baseUrl)
    if (md == null) continue
    const isListItem =
      block._type === "block" && Boolean((block as TextBlock).listItem)
    pieces.push({ isListItem, md })
  }

  return pieces.reduce((acc, piece, i) => {
    if (i === 0) return piece.md
    const prev = pieces[i - 1]
    // Keep consecutive list items tight; separate everything else by a blank line.
    const sep = prev?.isListItem && piece.isListItem ? "\n" : "\n\n"
    return acc + sep + piece.md
  }, "")
}

function renderBlock(
  block: PortableTextBlock,
  baseUrl: string | undefined
): string | null {
  switch (block._type) {
    case "block":
      return renderTextBlock(block as unknown as TextBlock, baseUrl)
    case "image":
      return renderImage(block as unknown as SanityImage & { caption?: string })
    case "gridGallery":
      return renderGallery(block as unknown as GalleryValue)
    case "quoteWithAuthor":
      return renderQuote(block as unknown as QuoteValue, baseUrl)
    case "sideNote":
      return renderSideNote(block as unknown as SideNoteValue, baseUrl)
    case "codeBlock":
      return renderCodeBlock(block as unknown as CodeBlockValue)
    case "videoEmbed":
      return renderVideo(block as unknown as VideoValue)
    case "tweetEmbed":
      return renderTweet(block as unknown as { tweetId?: string })
    case "codeSandbox":
      return renderSandbox(block as unknown as { sandboxKey?: string })
    default:
      return null
  }
}

function renderTextBlock(
  block: TextBlock,
  baseUrl: string | undefined
): string | null {
  const markDefs = block.markDefs ?? []
  const text = (block.children ?? [])
    .map((child) => serializeSpan(child, markDefs, baseUrl))
    .join("")

  if (!text.trim()) return null

  if (block.listItem) {
    const indent = "  ".repeat(Math.max(0, (block.level ?? 1) - 1))
    const marker = block.listItem === "number" ? "1." : "-"
    return `${indent}${marker} ${text}`
  }

  switch (block.style) {
    case "h1":
      return `# ${text}`
    case "h2":
      return `## ${text}`
    case "h3":
      return `### ${text}`
    case "h4":
      return `#### ${text}`
    case "blockquote":
      return blockquote(text)
    default:
      return text
  }
}

function serializeSpan(
  span: Span,
  markDefs: MarkDef[],
  baseUrl: string | undefined
): string {
  if (span._type !== "span") return ""
  let text = span.text ?? ""
  const marks = span.marks ?? []

  // Inline code suppresses other formatting inside it, so apply it first.
  if (marks.includes("code")) text = `\`${text}\``
  if (marks.includes("strong")) text = `**${text}**`
  if (marks.includes("em")) text = `*${text}*`

  const linkKey = marks.find((mark) => !DECORATORS.has(mark))
  if (linkKey) {
    const def = markDefs.find((d) => d._key === linkKey)
    if (def?.href) text = `[${text}](${absolutize(def.href, baseUrl)})`
  }

  return text
}

function renderImage(block: SanityImage & { caption?: string }): string | null {
  const img = getImageUrl(block)
  if (!img) return null
  const alt = img.alt || block.caption || "Image"
  let md = `![${alt}](${img.src})`
  if (block.caption) md += `\n\n_${block.caption}_`
  return md
}

function renderGallery(block: GalleryValue): string | null {
  const parts = (block.images ?? [])
    .map((image) => {
      const img = getImageUrl(image)
      return img ? `![${img.alt || "Image"}](${img.src})` : null
    })
    .filter((part): part is string => part !== null)

  if (!parts.length) return null
  let md = parts.join("\n\n")
  if (block.caption) md += `\n\n_${block.caption}_`
  return md
}

function renderQuote(
  block: QuoteValue,
  baseUrl: string | undefined
): string | null {
  const quoteMd = portableTextToMarkdown(block.quote, { baseUrl })
  const attribution = [block.author, block.role].filter(Boolean).join(", ")
  const inner = [quoteMd, attribution && `— ${attribution}`]
    .filter(Boolean)
    .join("\n\n")
  return inner ? blockquote(inner) : null
}

function renderSideNote(
  block: SideNoteValue,
  baseUrl: string | undefined
): string | null {
  const contentMd = portableTextToMarkdown(block.content, { baseUrl })
  const inner = ["**Note**", contentMd].filter(Boolean).join("\n\n")
  return blockquote(inner)
}

function renderCodeBlock(block: CodeBlockValue): string | null {
  const files = block.files ?? []
  if (!files.length) return null
  return files
    .map((file) => {
      const title = file.title ? `**${file.title}**\n\n` : ""
      return `${title}\`\`\`${file.language ?? ""}\n${file.code ?? ""}\n\`\`\``
    })
    .join("\n\n")
}

function renderVideo(block: VideoValue): string | null {
  const playbackId = block.muxVideo?.playbackId
  const url = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8`
    : block.videoUrl
  if (!url) return null
  let md = `[${block.caption || "Watch video"}](${url})`
  if (block.caption) md += `\n\n_${block.caption}_`
  return md
}

function renderTweet(block: { tweetId?: string }): string | null {
  if (!block.tweetId) return null
  return `[View tweet](https://twitter.com/i/web/status/${block.tweetId})`
}

function renderSandbox(block: { sandboxKey?: string }): string | null {
  if (!block.sandboxKey) return null
  return `[Interactive code sandbox: ${block.sandboxKey}]`
}

function blockquote(text: string): string {
  return text
    .split("\n")
    .map((line) => (line ? `> ${line}` : ">"))
    .join("\n")
}

function absolutize(href: string, baseUrl: string | undefined): string {
  const normalized = normalizeHref(href)
  if (!baseUrl) return normalized
  if (normalized.startsWith("/")) return `${baseUrl}${normalized}`
  return normalized
}
