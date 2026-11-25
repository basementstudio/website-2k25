// crypto.randomUUID is missing in non-secure contexts, older browsers and
// some hardened/automated environments. Fall back to getRandomValues, then to
// Math.random, so callers that only need a unique key never throw.
export const createId = (): string => {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined

  if (c && typeof c.randomUUID === "function") return c.randomUUID()

  const bytes = new Uint8Array(16)
  if (c && typeof c.getRandomValues === "function") {
    c.getRandomValues(bytes)
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }

  // RFC 4122 version 4 / variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
