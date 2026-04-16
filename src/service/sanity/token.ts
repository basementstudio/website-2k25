export const token = process.env.SANITY_READ_TOKEN

if (process.env.NODE_ENV !== "production" && !token) {
  console.warn(
    "[sanity] Missing SANITY_READ_TOKEN — draft mode and live preview will not work."
  )
}
