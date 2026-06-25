import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr"
import {
  Badge,
  Box,
  Card,
  Flex,
  Spinner,
  Stack,
  Text,
  TextInput
} from "@sanity/ui"
import { useEffect, useRef, useState } from "react"
import { type SanityClient, useClient } from "sanity"
import { usePaneRouter } from "sanity/structure"

import { apiVersion } from "../env"

interface CollectionItem {
  _id: string
  _originalId?: string
  title?: string | null
  subtitle?: string | null
}

// `_originalId` is prefixed `drafts.` when an unpublished edit exists, so it's
// our signal that the document has pending changes.
const isDraftItem = (item: CollectionItem) =>
  !!item._originalId?.startsWith("drafts.")

const normalizeId = (id: string) => id.replace(/^drafts\./, "")

const PROJECTION = `{
  _id,
  _originalId,
  "title": coalesce(title, name, "Untitled"),
  "subtitle": coalesce(slug.current, role, client->title)
}`

const sortByTitle = (items: CollectionItem[]) =>
  [...items].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""))

interface CollectionPaneProps {
  options?: Record<string, unknown>
}

// Searchable, live-updating list pane for a single document type, with a
// "Draft" badge for documents that have unpublished edits. Wired into the desk
// structure via S.component() — see sanity.config.ts.
export function CollectionPane({ options }: CollectionPaneProps) {
  const schemaType = options?.schemaType as string

  const [items, setItems] = useState<CollectionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  const baseClient = useClient({ apiVersion })
  // Pinned to drafts so the list reflects in-progress edits and the badge.
  const clientRef = useRef<SanityClient | null>(null)
  if (!clientRef.current) {
    clientRef.current = baseClient.withConfig({ perspective: "drafts" })
  }
  const client = clientRef.current

  const { ChildLink, routerPanesState, groupIndex } = usePaneRouter()
  const activeChildId = routerPanesState[groupIndex + 1]?.[0]?.id ?? null

  useEffect(() => {
    if (!schemaType) return

    setLoading(true)
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const fetchItems = () => {
      client
        .fetch<CollectionItem[]>(`*[_type == $type] ${PROJECTION}`, {
          type: schemaType
        })
        .then((data) => {
          if (cancelled) return
          setItems(data)
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    }

    fetchItems()

    // Refetch (debounced) on every mutation of this type to stay live.
    const subscription = client
      .listen(
        `*[_type == $type]`,
        { type: schemaType },
        { visibility: "query", events: ["mutation"], includeResult: false }
      )
      .subscribe(() => {
        clearTimeout(timer)
        timer = setTimeout(fetchItems, 300)
      })

    return () => {
      cancelled = true
      clearTimeout(timer)
      subscription.unsubscribe()
    }
  }, [schemaType, client])

  const term = query.toLowerCase().trim()
  const sorted = sortByTitle(items)
  const filtered = term
    ? sorted.filter(
        (item) =>
          item.title?.toLowerCase().includes(term) ||
          item.subtitle?.toLowerCase().includes(term)
      )
    : sorted

  return (
    <Flex direction="column" style={{ height: "100%" }}>
      <Box padding={3}>
        <TextInput
          icon={MagnifyingGlassIcon}
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          clearButton={!!query}
          onClear={() => setQuery("")}
        />
      </Box>
      <Box style={{ borderBottom: "1px solid var(--card-border-color)" }} />
      <Box style={{ flex: 1, overflowY: "auto" }}>
        {loading && (
          <Flex justify="center" padding={4}>
            <Spinner />
          </Flex>
        )}
        {!loading && filtered.length === 0 && (
          <Flex padding={4} justify="center">
            <Text muted size={1}>
              {term ? "No matches found" : "Nothing here yet"}
            </Text>
          </Flex>
        )}
        {!loading && filtered.length > 0 && (
          <Stack>
            {filtered.map((item) => (
              <ItemRow
                key={item._id}
                item={item}
                ChildLink={ChildLink}
                isActive={normalizeId(item._id) === activeChildId}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}

interface ItemRowProps {
  item: CollectionItem
  ChildLink: ReturnType<typeof usePaneRouter>["ChildLink"]
  isActive: boolean
}

const ItemRow = ({ item, ChildLink, isActive }: ItemRowProps) => (
  <ChildLink childId={normalizeId(item._id)}>
    <Card
      as="div"
      padding={3}
      radius={0}
      pressed={isActive}
      tone={isActive ? "primary" : "default"}
      style={{
        cursor: "pointer",
        display: "block",
        ...(isActive && {
          backgroundColor: "var(--card-badge-primary-bg-color)",
          color: "var(--card-badge-primary-fg-color)"
        })
      }}
    >
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="medium">
            {item.title ?? "Untitled"}
          </Text>
          {isDraftItem(item) && (
            <Badge fontSize={0} mode="outline" tone="caution">
              Draft
            </Badge>
          )}
        </Flex>
        {item.subtitle && (
          <Text size={0} muted>
            {item.subtitle}
          </Text>
        )}
      </Stack>
    </Card>
  </ChildLink>
)
