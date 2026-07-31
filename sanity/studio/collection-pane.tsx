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
import { type ComponentType, useEffect, useRef, useState } from "react"
import { type SanityClient, useClient } from "sanity"
import { usePaneRouter } from "sanity/structure"

import { apiVersion } from "../env"

interface CollectionItem {
  _id: string
  _originalId?: string
  title?: string | null
  slug?: string | null
  subtitle?: string | null
  imageUrl?: string | null
}

// `_originalId` is prefixed `drafts.` when an unpublished edit exists, so it's
// our signal that the document has pending changes.
const isDraftItem = (item: CollectionItem) =>
  !!item._originalId?.startsWith("drafts.")

const normalizeId = (id: string) => id.replace(/^drafts\./, "")

// Slug shown as a path; everything else (role, client) is a plain subtitle.
const getSubtitle = (item: CollectionItem) =>
  item.slug ? `/${item.slug}` : (item.subtitle ?? null)

const THUMB_SIZE = 35

// `imageUrl` coalesces the common thumbnail fields across our document types
// (heroImage for posts, cover for projects, image/logo/avatar elsewhere).
const PROJECTION = `{
  _id,
  _originalId,
  "title": coalesce(title, name, "Untitled"),
  "slug": slug.current,
  "subtitle": coalesce(role, client->title),
  "imageUrl": coalesce(
    heroImage.asset->url,
    cover.asset->url,
    image.asset->url,
    logo.asset->url,
    avatar.asset->url
  )
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
  const FallbackIcon = options?.icon as ComponentType<{ size?: number }>

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
          item.slug?.toLowerCase().includes(term) ||
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
                FallbackIcon={FallbackIcon}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}

interface ThumbnailProps {
  imageUrl?: string | null
  FallbackIcon?: ComponentType<{ size?: number }>
}

const Thumbnail = ({ imageUrl, FallbackIcon }: ThumbnailProps) => (
  <Box
    style={{
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      flexShrink: 0,
      borderRadius: 3,
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--card-muted-bg-color)",
      color: "var(--card-muted-fg-color)"
    }}
  >
    {imageUrl ? (
      // Sanity CDN URL with crop params — plain img is correct inside Studio
      // (not a Next.js render context).
      <img
        src={`${imageUrl}?w=${THUMB_SIZE * 2}&h=${THUMB_SIZE * 2}&fit=crop&auto=format`}
        alt=""
        width={THUMB_SIZE}
        height={THUMB_SIZE}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : FallbackIcon ? (
      <FallbackIcon size={18} />
    ) : null}
  </Box>
)

interface ItemRowProps {
  item: CollectionItem
  ChildLink: ReturnType<typeof usePaneRouter>["ChildLink"]
  isActive: boolean
  FallbackIcon?: ComponentType<{ size?: number }>
}

const ItemRow = ({ item, ChildLink, isActive, FallbackIcon }: ItemRowProps) => {
  const subtitle = getSubtitle(item)
  return (
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
        <Flex align="center" gap={3}>
          <Thumbnail imageUrl={item.imageUrl} FallbackIcon={FallbackIcon} />
          <Stack space={2} flex={1}>
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
            {subtitle && (
              <Text size={0} muted>
                {subtitle}
              </Text>
            )}
          </Stack>
        </Flex>
      </Card>
    </ChildLink>
  )
}
