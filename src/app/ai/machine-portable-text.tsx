import { Fragment } from "react"

import { linkClass } from "@/app/ai/components"
import { getImageUrl } from "@/service/sanity/helpers"
import type {
  PortableTextBlock,
  SanityImage,
  SanityMuxVideo
} from "@/service/sanity/types"
import { normalizeHref } from "@/utils/seo"

// CMS links can be internal (root-relative or basement.studio) or external —
// only external ones open in a new tab. Subdomains (lab.basement.studio) are
// separate properties and count as external.
const isExternalHref = (href: string) =>
  /^https?:\/\//i.test(href) &&
  !/^https?:\/\/(?:www\.)?basement\.studio(?=[/?#]|$)/i.test(href)

import { MachineCodeBlock } from "./machine-code-block"

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
  _key?: string
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

const quoteClass = "border-l border-machine-dim pl-4 text-machine-bright"

/**
 * Renders Sanity Portable Text as terminal-styled markup for the machine view:
 * markdown-flavored headings, `- ` lists, bracketed placeholders for rich
 * media (images, video, sandboxes) linking to the raw asset. Mirrors the
 * block/mark coverage of `portable-text-to-markdown.ts` so the machine page
 * matches the `.md` output.
 */
export const MachinePortableText = ({
  blocks
}: {
  blocks: PortableTextBlock[] | null | undefined
}) => {
  if (!blocks?.length) return null

  // Group consecutive list items (any kind or level — nesting can mix them)
  // into a single run; List rebuilds the level tree from it.
  const groups: Array<
    | { kind: "list"; items: TextBlock[] }
    | { kind: "single"; block: PortableTextBlock }
  > = []
  for (const block of blocks) {
    const listItem =
      block._type === "block" ? (block as unknown as TextBlock).listItem : null
    const prev = groups[groups.length - 1]
    if (listItem) {
      if (prev?.kind === "list") {
        prev.items.push(block as unknown as TextBlock)
      } else {
        groups.push({ kind: "list", items: [block as unknown as TextBlock] })
      }
    } else {
      groups.push({ kind: "single", block })
    }
  }

  return (
    <>
      {groups.map((group, i) =>
        group.kind === "list" ? (
          <List key={i} items={group.items} />
        ) : (
          <Block key={i} block={group.block} />
        )
      )}
    </>
  )
}

const Block = ({ block }: { block: PortableTextBlock }) => {
  switch (block._type) {
    case "block":
      return <Text block={block as unknown as TextBlock} />
    case "image":
      return (
        <ImagePlaceholder
          image={block as unknown as SanityImage & { caption?: string }}
        />
      )
    case "gridGallery":
      return <Gallery value={block as unknown as GalleryValue} />
    case "quoteWithAuthor":
      return <Quote value={block as unknown as QuoteValue} />
    case "sideNote":
      return <SideNote value={block as unknown as SideNoteValue} />
    case "codeBlock":
      return <Code value={block as unknown as CodeBlockValue} />
    case "videoEmbed":
      return <VideoPlaceholder value={block as unknown as VideoValue} />
    case "tweetEmbed":
      return (
        <TweetPlaceholder value={block as unknown as { tweetId?: string }} />
      )
    case "codeSandbox":
      return (
        <SandboxPlaceholder
          value={block as unknown as { sandboxKey?: string }}
        />
      )
    default:
      return null
  }
}

const Spans = ({ block }: { block: TextBlock }) => {
  const markDefs = block.markDefs ?? []
  return (
    <>
      {(block.children ?? []).map((span, i) => {
        if (span._type !== "span") return null
        let node: React.ReactNode = span.text ?? ""
        const marks = span.marks ?? []

        // Inline code suppresses other formatting inside it, so apply it first.
        if (marks.includes("code")) {
          node = <code className="text-machine-bright">`{node}`</code>
        }
        if (marks.includes("strong")) {
          node = <strong className="text-machine-bright">{node}</strong>
        }
        if (marks.includes("em")) node = <em>{node}</em>

        const linkKey = marks.find((mark) => !DECORATORS.has(mark))
        if (linkKey) {
          const def = markDefs.find((d) => d._key === linkKey)
          if (def?.href) {
            const href = normalizeHref(def.href)
            node = (
              <a
                href={href}
                target={isExternalHref(href) ? "_blank" : undefined}
                rel="noopener"
                className={linkClass}
              >
                {node}
              </a>
            )
          }
        }

        return <Fragment key={i}>{node}</Fragment>
      })}
    </>
  )
}

const Text = ({ block }: { block: TextBlock }) => {
  const spans = <Spans block={block} />

  switch (block.style) {
    case "h1":
      return <h2 className="text-machine-bright"># {spans}</h2>
    case "h2":
      return <h2 className="text-machine-bright">## {spans}</h2>
    case "h3":
      return <h3 className="text-machine-bright">### {spans}</h3>
    case "h4":
      return <h4 className="text-machine-bright">#### {spans}</h4>
    case "blockquote":
      return <blockquote className={quoteClass}>{spans}</blockquote>
    default:
      return <p>{spans}</p>
  }
}

interface ListNode {
  block: TextBlock
  children: ListNode[]
}

/**
 * Rebuilds the nesting tree Portable Text flattens into `level`: deeper items
 * become children of the previous shallower item, so sublists render as real
 * nested `<ul>/<ol>` and ordered sublists restart their numbering.
 */
const buildListTree = (items: TextBlock[]): ListNode[] => {
  const roots: ListNode[] = []
  const stack: Array<{ level: number; nodes: ListNode[] }> = [
    { level: 1, nodes: roots }
  ]
  for (const item of items) {
    const level = Math.max(1, item.level ?? 1)
    while (stack.length > 1 && level < stack[stack.length - 1].level) {
      stack.pop()
    }
    const top = stack[stack.length - 1]
    const parent = top.nodes[top.nodes.length - 1]
    if (level > top.level && parent) {
      stack.push({ level, nodes: parent.children })
      parent.children.push({ block: item, children: [] })
    } else {
      top.nodes.push({ block: item, children: [] })
    }
  }
  return roots
}

const List = ({ items }: { items: TextBlock[] }) => (
  <ListLevel nodes={buildListTree(items)} depth={0} />
)

const ListLevel = ({ nodes, depth }: { nodes: ListNode[]; depth: number }) => {
  // Consecutive same-kind siblings share a list; a kind switch starts a new
  // one (so a numbered run after bullets numbers from 1).
  const groups: Array<{ listItem: "bullet" | "number"; nodes: ListNode[] }> = []
  for (const node of nodes) {
    const listItem = node.block.listItem ?? "bullet"
    const prev = groups[groups.length - 1]
    if (prev?.listItem === listItem) {
      prev.nodes.push(node)
    } else {
      groups.push({ listItem, nodes: [node] })
    }
  }

  return (
    <>
      {groups.map((group, gi) => {
        const Tag = group.listItem === "number" ? "ol" : "ul"
        return (
          <Tag key={gi} className="flex flex-col gap-1">
            {group.nodes.map((node, i) => (
              <li key={node.block._key ?? i} className="whitespace-pre-wrap">
                {"  ".repeat(depth)}
                {group.listItem === "number" ? `${i + 1}. ` : "- "}
                <Spans block={node.block} />
                {node.children.length ? (
                  <ListLevel nodes={node.children} depth={depth + 1} />
                ) : null}
              </li>
            ))}
          </Tag>
        )
      })}
    </>
  )
}

/** `[caption]` line under media placeholders. */
const Caption = ({ caption }: { caption?: string }) =>
  caption ? <span className="text-machine-dim"> — {caption}</span> : null

const ImagePlaceholder = ({
  image
}: {
  image: SanityImage & { caption?: string }
}) => {
  const img = getImageUrl(image)
  if (!img) return null
  return (
    <p className="text-machine-dim">
      <a href={img.src} target="_blank" rel="noopener" className={linkClass}>
        [image: {img.alt || image.caption || "untitled"}]
      </a>
      <Caption caption={image.caption} />
    </p>
  )
}

const Gallery = ({ value }: { value: GalleryValue }) => {
  const images = (value.images ?? [])
    .map((image) => getImageUrl(image))
    .filter((img): img is NonNullable<typeof img> => img !== null)
  if (!images.length) return null
  return (
    <p className="flex flex-col gap-1 text-machine-dim">
      {images.map((img, i) => (
        <a
          key={i}
          href={img.src}
          target="_blank"
          rel="noopener"
          className={linkClass}
        >
          [image {i + 1}/{images.length}: {img.alt || "untitled"}]
        </a>
      ))}
      <Caption caption={value.caption} />
    </p>
  )
}

const Quote = ({ value }: { value: QuoteValue }) => {
  const attribution = [value.author, value.role].filter(Boolean).join(", ")
  return (
    <blockquote className={`flex flex-col gap-2 ${quoteClass}`}>
      <MachinePortableText blocks={value.quote} />
      {attribution ? <p className="text-machine-dim">— {attribution}</p> : null}
    </blockquote>
  )
}

const SideNote = ({ value }: { value: SideNoteValue }) => (
  <aside className="flex flex-col gap-2 border-l border-machine-dim pl-4">
    <p className="text-machine-dim">[note]</p>
    <MachinePortableText blocks={value.content} />
  </aside>
)

const Code = ({ value }: { value: CodeBlockValue }) => (
  <MachineCodeBlock files={value.files ?? []} />
)

const VideoPlaceholder = ({ value }: { value: VideoValue }) => {
  const playbackId = value.muxVideo?.playbackId
  const url = playbackId
    ? `https://stream.mux.com/${playbackId}.m3u8`
    : value.videoUrl
  if (!url) return null
  return (
    <p className="text-machine-dim">
      <a href={url} target="_blank" rel="noopener" className={linkClass}>
        [video: {value.caption || "stream"}]
      </a>
    </p>
  )
}

const TweetPlaceholder = ({ value }: { value: { tweetId?: string } }) => {
  if (!value.tweetId) return null
  return (
    <p className="text-machine-dim">
      <a
        href={`https://twitter.com/i/web/status/${value.tweetId}`}
        target="_blank"
        rel="noopener"
        className={linkClass}
      >
        [tweet: {value.tweetId}]
      </a>
    </p>
  )
}

const SandboxPlaceholder = ({ value }: { value: { sandboxKey?: string } }) => {
  if (!value.sandboxKey) return null
  return (
    <p className="text-machine-dim">
      [interactive code sandbox: {value.sandboxKey} — available on the human
      view]
    </p>
  )
}
