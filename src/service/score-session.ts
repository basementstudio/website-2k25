import crypto from "crypto"

// Server-only HMAC helpers for basketball score sessions. A token is issued
// when a game starts and must accompany the score submission; because only
// the server can sign one, a forged POST can't invent a session, and the
// issued-at timestamp lets the API require that at least one real game
// duration elapsed before a score arrives.

const FALLBACK_DEV_SECRET = "basketball-dev-secret-not-for-production"

let warned = false
const getSecret = () => {
  const secret = process.env.SCORES_SESSION_SECRET
  if (!secret && !warned) {
    warned = true
    console.warn(
      "SCORES_SESSION_SECRET is not set — score sessions are signed with a dev fallback"
    )
  }
  return secret || FALLBACK_DEV_SECRET
}

export interface ScoreSession {
  iat: number
  nonce: string
}

const sign = (payload: string) =>
  crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url")

export const issueSessionToken = (): string => {
  const session: ScoreSession = {
    iat: Date.now(),
    nonce: crypto.randomBytes(12).toString("base64url")
  }
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export const verifySessionToken = (token: string): ScoreSession | null => {
  const parts = token.split(".")
  if (parts.length !== 2) return null
  const [payload, signature] = parts

  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString())
    if (typeof session.iat !== "number" || typeof session.nonce !== "string") {
      return null
    }
    return session as ScoreSession
  } catch {
    return null
  }
}
