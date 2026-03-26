import { nanoid } from 'nanoid'

// --- TipTap/ProseMirror types (BaseHub rich text JSON) ---

interface TipTapMark {
  type: string
  attrs?: Record<string, unknown>
}

interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  marks?: TipTapMark[]
  attrs?: Record<string, unknown>
}

// --- Sanity Portable Text types ---

interface PTMarkDef {
  _key: string
  _type: string
  href?: string
  [key: string]: unknown
}

interface PTSpan {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

interface PTBlock {
  _type: 'block'
  _key: string
  style: string
  listItem?: 'bullet' | 'number'
  level?: number
  children: PTSpan[]
  markDefs: PTMarkDef[]
}

type PortableTextBlock = PTBlock | Record<string, unknown>

// --- Mark conversion ---

const MARK_MAP: Record<string, string> = {
  bold: 'strong',
  italic: 'em',
  code: 'code',
  underline: 'underline',
  strike: 'strike-through',
  kbd: 'code',
}

function generateKey(): string {
  return nanoid(12)
}

/**
 * Convert TipTap text marks to PT mark names and collect markDefs for links.
 */
function convertMarks(
  marks: TipTapMark[] | undefined,
  markDefs: PTMarkDef[]
): string[] {
  if (!marks || marks.length === 0) return []

  const ptMarks: string[] = []

  for (const mark of marks) {
    if (mark.type === 'link') {
      const key = generateKey()
      markDefs.push({
        _key: key,
        _type: 'link',
        href: (mark.attrs?.href as string) || '',
      })
      ptMarks.push(key)
    } else if (mark.type === 'basehub-inline-block') {
      // Skip inline blocks — handled separately in US-016
      continue
    } else {
      const ptMark = MARK_MAP[mark.type]
      if (ptMark) {
        ptMarks.push(ptMark)
      }
    }
  }

  return ptMarks
}

/**
 * Convert inline content (text nodes, hardBreaks) to PT spans.
 */
function convertInlineContent(
  nodes: TipTapNode[] | undefined,
  markDefs: PTMarkDef[]
): PTSpan[] {
  if (!nodes || nodes.length === 0) {
    return [{ _type: 'span', _key: generateKey(), text: '', marks: [] }]
  }

  const spans: PTSpan[] = []

  for (const node of nodes) {
    if (node.type === 'text') {
      spans.push({
        _type: 'span',
        _key: generateKey(),
        text: node.text || '',
        marks: convertMarks(node.marks, markDefs),
      })
    } else if (node.type === 'hardBreak') {
      spans.push({
        _type: 'span',
        _key: generateKey(),
        text: '\n',
        marks: [],
      })
    }
    // Other inline types (image, basehub-inline-block) handled in US-016
  }

  if (spans.length === 0) {
    spans.push({ _type: 'span', _key: generateKey(), text: '', marks: [] })
  }

  return spans
}

/**
 * Convert a paragraph or heading node to a PT block.
 */
function convertTextBlock(
  node: TipTapNode,
  style: string,
  listItem?: 'bullet' | 'number',
  level?: number
): PTBlock {
  const markDefs: PTMarkDef[] = []
  const children = convertInlineContent(node.content, markDefs)

  const block: PTBlock = {
    _type: 'block',
    _key: generateKey(),
    style,
    children,
    markDefs,
  }

  if (listItem) block.listItem = listItem
  if (level !== undefined && level > 0) block.level = level

  return block
}

/**
 * Flatten list items from a bulletList/orderedList into PT blocks.
 * Handles nested lists by increasing the level.
 */
function flattenListItems(
  node: TipTapNode,
  listType: 'bullet' | 'number',
  level: number
): PTBlock[] {
  const blocks: PTBlock[] = []

  if (!node.content) return blocks

  for (const listItem of node.content) {
    if (listItem.type !== 'listItem') continue

    if (!listItem.content) continue

    for (const child of listItem.content) {
      if (child.type === 'paragraph') {
        blocks.push(convertTextBlock(child, 'normal', listType, level))
      } else if (child.type === 'heading') {
        const headingLevel = (child.attrs?.level as number) || 2
        blocks.push(
          convertTextBlock(child, `h${headingLevel}`, listType, level)
        )
      } else if (
        child.type === 'bulletList' ||
        child.type === 'orderedList'
      ) {
        // Nested list — increase level
        const nestedType =
          child.type === 'bulletList' ? 'bullet' : 'number'
        blocks.push(...flattenListItems(child, nestedType, level + 1))
      }
    }
  }

  return blocks
}

/**
 * Convert a single TipTap node to one or more PT blocks.
 * Returns an array because lists expand into multiple blocks.
 */
function convertNode(node: TipTapNode): PortableTextBlock[] {
  switch (node.type) {
    case 'paragraph':
      return [convertTextBlock(node, 'normal')]

    case 'heading': {
      const level = (node.attrs?.level as number) || 2
      return [convertTextBlock(node, `h${level}`)]
    }

    case 'bulletList':
      return flattenListItems(node, 'bullet', 1)

    case 'orderedList':
      return flattenListItems(node, 'number', 1)

    case 'horizontalRule':
      // No direct PT equivalent — skip or convert to break
      return []

    case 'hardBreak':
      // Top-level hard break — unusual, skip
      return []

    case 'blockquote': {
      // Convert blockquote children as 'blockquote' style blocks
      const blocks: PortableTextBlock[] = []
      if (node.content) {
        for (const child of node.content) {
          if (child.type === 'paragraph') {
            blocks.push(convertTextBlock(child, 'blockquote'))
          } else {
            blocks.push(...convertNode(child))
          }
        }
      }
      return blocks
    }

    case 'codeBlock': {
      // Native TipTap codeBlock (not custom BaseHub CodeBlockComponent)
      const code =
        node.content?.map((c) => c.text || '').join('') || ''
      const language = (node.attrs?.language as string) || 'text'
      return [
        {
          _type: 'codeBlock',
          _key: generateKey(),
          files: [{ _key: generateKey(), title: 'code', code, language }],
        },
      ]
    }

    case 'image': {
      // Inline image — placeholder, full implementation in US-016
      return [
        {
          _type: 'image',
          _key: generateKey(),
          _sanity_placeholder: true,
          src: (node.attrs?.src as string) || '',
        },
      ]
    }

    case 'basehub-block':
    case 'basehub-inline-block':
      // Custom blocks — handled in US-016
      return [
        {
          _type: '__basehub_block_placeholder',
          _key: generateKey(),
          id: (node.attrs?.id as string) || '',
        },
      ]

    default:
      // Unknown node type — try to extract text content
      if (node.content) {
        const blocks: PortableTextBlock[] = []
        for (const child of node.content) {
          blocks.push(...convertNode(child))
        }
        return blocks
      }
      return []
  }
}

/**
 * Convert BaseHub TipTap/ProseMirror JSON content to Sanity Portable Text.
 *
 * @param basehubJson - The raw json.content array from BaseHub
 * @param _blocks - Reserved for US-016: custom block data from json.blocks
 * @returns Array of Portable Text blocks
 */
export function convertRichText(
  basehubJson: TipTapNode[] | undefined | null,
  _blocks?: unknown[]
): PortableTextBlock[] {
  if (!basehubJson || basehubJson.length === 0) return []

  const result: PortableTextBlock[] = []

  for (const node of basehubJson) {
    result.push(...convertNode(node))
  }

  return result
}

/**
 * Validate that all Portable Text blocks and spans have _key values.
 * Returns an array of error messages (empty = valid).
 */
export function validatePortableText(
  blocks: PortableTextBlock[]
): string[] {
  const errors: string[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]

    if (!block || !('_key' in block) || !block._key) {
      errors.push(`Block at index ${i} is missing _key`)
    }

    if (!block || !('_type' in block) || !block._type) {
      errors.push(`Block at index ${i} is missing _type`)
    }

    // Validate children for standard blocks
    if (block && '_type' in block && block._type === 'block') {
      const ptBlock = block as PTBlock
      if (!ptBlock.children || ptBlock.children.length === 0) {
        errors.push(`Block at index ${i} has no children`)
      } else {
        for (let j = 0; j < ptBlock.children.length; j++) {
          const child = ptBlock.children[j]
          if (!child?._key) {
            errors.push(
              `Span at block[${i}].children[${j}] is missing _key`
            )
          }
        }
      }

      // Validate markDefs
      if (ptBlock.markDefs) {
        for (let j = 0; j < ptBlock.markDefs.length; j++) {
          const def = ptBlock.markDefs[j]
          if (!def?._key) {
            errors.push(
              `MarkDef at block[${i}].markDefs[${j}] is missing _key`
            )
          }
        }
      }
    }
  }

  return errors
}

export type {
  TipTapNode,
  TipTapMark,
  PTBlock,
  PTSpan,
  PTMarkDef,
  PortableTextBlock,
}
