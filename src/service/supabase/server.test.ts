import assert from "node:assert/strict"
import { after, before, test, type TestContext } from "node:test"

import { getTopScoresFromServer } from "./server"

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

before(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://scores.example.com"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-key"
})

after(() => {
  if (originalUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
  else process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
  if (originalKey === undefined)
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey
})

const row = (id: number, clientId: string | null = `browser-${id}`) => ({
  id,
  client_id: clientId,
  player_name: "AAA",
  score: 222,
  created_at: "2026-09-03T13:00:00Z",
  country: "🏳️"
})

// Exercise the real Supabase query builder while replacing only HTTP.
const mockScores = (
  t: TestContext,
  rows: ReturnType<typeof row>[],
  failAtOffset?: number
) => {
  const offsets: number[] = []
  const ranked = [...rows].sort(
    (a, b) =>
      b.score - a.score ||
      a.created_at.localeCompare(b.created_at) ||
      a.id - b.id
  )

  t.mock.method(globalThis, "fetch", async (input: string) => {
    const url = new URL(input)
    assert.equal(url.origin, "https://scores.example.com")
    assert.equal(url.pathname, "/rest/v1/scoreboard")
    assert.equal(url.searchParams.get("select"), "*")
    assert.equal(
      url.searchParams.get("order"),
      "score.desc,created_at.asc,id.asc"
    )
    const offset = Number(url.searchParams.get("offset"))
    const limit = Number(url.searchParams.get("limit"))
    assert.equal(limit, 100)
    offsets.push(offset)
    if (offset === failAtOffset) {
      return Response.json({ message: "Database unavailable" }, { status: 400 })
    }
    return Response.json(ranked.slice(offset, offset + limit))
  })

  return offsets
}

test("keeps each browser's highest score across names and countries", async (t) => {
  const best = row(2, "same-browser")
  const other = row(3)
  mockScores(t, [
    { ...row(1, "same-browser"), score: 172, player_name: "OLD" },
    best,
    { ...row(4, "same-browser"), score: 122, country: "🇦🇷" },
    other
  ])

  assert.deepEqual(await getTopScoresFromServer(), {
    data: [best, other],
    error: null
  })
})

test("breaks equal-score ties by earliest creation, then row ID", async (t) => {
  const first = row(2, "same-browser")
  mockScores(t, [
    { ...row(1, "same-browser"), created_at: "2026-09-04T13:00:00Z" },
    row(3, "same-browser"),
    first
  ])

  assert.deepEqual((await getTopScoresFromServer()).data, [first])
})

test("preserves separate legacy rows without client IDs", async (t) => {
  const rows = [row(1, null), row(2, ""), row(3, null), row(4, "1")]
  mockScores(t, rows)

  assert.deepEqual((await getTopScoresFromServer()).data, rows)
})

test("fills 25 distinct places across duplicate-heavy batches", async (t) => {
  const duplicates = Array.from({ length: 205 }, (_, i) => row(i, "same"))
  const others = Array.from({ length: 40 }, (_, i) => row(205 + i))
  const offsets = mockScores(t, [...duplicates, ...others])
  const { data, error } = await getTopScoresFromServer()

  assert.equal(error, null)
  assert.deepEqual(offsets, [0, 100, 200])
  assert.deepEqual(data, [duplicates[0], ...others.slice(0, 24)])
  // The wall board consumes the first 12; duplicates must not crowd it out.
  assert.equal(
    new Set(data.slice(0, 12).map((entry) => entry.client_id)).size,
    12
  )
})

test("stops fetching once 25 distinct places are found", async (t) => {
  const rows = Array.from({ length: 150 }, (_, i) => row(i))
  const offsets = mockScores(t, rows)

  assert.deepEqual((await getTopScoresFromServer()).data, rows.slice(0, 25))
  assert.deepEqual(offsets, [0])
})

test("caps reads at ten batches even when more duplicate rows remain", async (t) => {
  const rows = Array.from({ length: 1100 }, (_, i) => row(i, "same"))
  const offsets = mockScores(t, rows)

  assert.deepEqual(await getTopScoresFromServer(), {
    data: [rows[0]],
    error: null
  })
  assert.deepEqual(
    offsets,
    Array.from({ length: 10 }, (_, i) => i * 100)
  )
})

test("includes distinct entries in the final allowed batch", async (t) => {
  const duplicates = Array.from({ length: 995 }, (_, i) => row(i, "same"))
  const others = Array.from({ length: 30 }, (_, i) => row(995 + i))
  const offsets = mockScores(t, [...duplicates, ...others])

  assert.deepEqual(await getTopScoresFromServer(), {
    data: [duplicates[0], ...others.slice(0, 5)],
    error: null
  })
  assert.equal(offsets.length, 10)
})

test("handles an empty table", async (t) => {
  const offsets = mockScores(t, [])
  assert.deepEqual(await getTopScoresFromServer(), { data: [], error: null })
  assert.deepEqual(offsets, [0])
})

test("ends on an empty page after an exact full batch of duplicates", async (t) => {
  const rows = Array.from({ length: 100 }, (_, i) => row(i, "same"))
  const offsets = mockScores(t, rows)

  assert.deepEqual((await getTopScoresFromServer()).data, [rows[0]])
  assert.deepEqual(offsets, [0, 100])
})

for (const failAtOffset of [0, 100]) {
  test(`returns the existing error shape when offset ${failAtOffset} fails`, async (t) => {
    const rows = Array.from({ length: 100 }, (_, i) => row(i, "same"))
    mockScores(t, rows, failAtOffset)
    t.mock.method(console, "error", () => {})

    assert.deepEqual(await getTopScoresFromServer(), {
      data: [],
      error: "Database unavailable"
    })
  })
}
