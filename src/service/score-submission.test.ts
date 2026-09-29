import assert from "node:assert/strict"
import { after, before, test } from "node:test"

import { POST } from "../app/(site)/api/scores/route"
import { BLOCKED_SCORE_NAME_MESSAGE } from "./score-name"
import { issueSessionToken } from "./score-session"
import { submitScore } from "./supabase/client"

const testEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://scores.example.com",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  SCORES_SESSION_SECRET: "test-score-secret"
}
const originalEnv = Object.fromEntries(
  Object.keys(testEnv).map((key) => [key, process.env[key]])
)

before(() => Object.assign(process.env, testEnv))
after(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test("rejects blocked initials before any browser submission request", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Blocked names must not make a request")
  })

  for (const name of ["GaY", "DiK", "ASS"]) {
    await assert.rejects(submitScore(name, 222), {
      message: BLOCKED_SCORE_NAME_MESSAGE
    })
  }
  assert.equal(fetchMock.mock.callCount(), 0)
})

test("API rejection leaves the session available for corrected initials", async (t) => {
  const now = Date.now()
  const clock = t.mock.method(Date, "now", () => now - 24_000)
  const sessionToken = issueSessionToken()
  clock.mock.restore()

  const writes: Record<string, unknown>[] = []
  const fetchMock = t.mock.method(
    globalThis,
    "fetch",
    async (input: string, init?: RequestInit) => {
      const url = new URL(input)
      assert.equal(url.origin, "https://scores.example.com")
      assert.equal(url.pathname, "/rest/v1/scoreboard")
      if (init?.method === "POST") {
        writes.push(JSON.parse(String(init.body)))
        return Response.json([])
      }
      return Response.json(null)
    }
  )
  const request = (playerName: string) =>
    new Request("https://site.example.com/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerName,
        score: 222,
        clientId: "name-filter-test",
        sessionToken
      })
    })

  for (const name of ["GAY", "gay", "DiK", "ASS"]) {
    const rejected = await POST(request(name))
    assert.equal(rejected.status, 400)
    assert.deepEqual(await rejected.json(), {
      error: BLOCKED_SCORE_NAME_MESSAGE
    })
  }
  assert.equal(fetchMock.mock.callCount(), 0)

  const accepted = await POST(request("ABC"))
  assert.equal(accepted.status, 200)
  assert.deepEqual(await accepted.json(), { success: true })
  assert.equal(writes.length, 1)
  assert.equal(writes[0].player_name, "ABC")
  assert.equal(writes[0].score, 222)

  const replay = await POST(request("ABC"))
  assert.equal(replay.status, 400)
  assert.deepEqual(await replay.json(), { error: "Game session already used" })
  assert.equal(writes.length, 1)
})
