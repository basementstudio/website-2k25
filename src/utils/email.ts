// Requires a local part, an "@", and a domain containing a dot. Stricter than
// the browser's `type="email"` check (which accepts "user@localhost"), and in
// line with what Resend accepts.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value)
}
