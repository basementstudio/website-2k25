// RFC 5321 caps a forward path at 256 octets including the angle brackets,
// leaving 254 for the address itself.
const MAX_EMAIL_LENGTH = 254

// Requires a local part, an "@", and a domain made of two or more dot-separated
// labels. Stricter than the browser's `type="email"` check (which accepts
// "user@localhost"), and in line with what Resend accepts.
//
// Domain labels exclude "." so each character can only be matched one way,
// which keeps matching linear and avoids catastrophic backtracking on crafted
// input such as "a@" followed by many dots.
export const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/

export function isValidEmail(value: string) {
  if (value.length > MAX_EMAIL_LENGTH) return false
  return EMAIL_REGEX.test(value)
}
