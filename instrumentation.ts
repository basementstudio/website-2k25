export function register() {
  // No-op for initialization
}

const isNodejs = process.env.NEXT_RUNTIME === "nodejs"
const isPostHogEnabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "true"

export const onRequestError = async (err: Error, request: Request) => {
  if (isNodejs && isPostHogEnabled) {
    const { getPostHogServer } = await import("./src/lib/posthog")
    const posthog = getPostHogServer()

    let distinctId = null
    if (request.headers.get("cookie")) {
      const cookieString = request.headers.get("cookie")
      const postHogCookieMatch = cookieString?.match(
        /ph_phc_.*?_posthog=([^;]+)/
      )

      if (postHogCookieMatch && postHogCookieMatch[1]) {
        try {
          const decodedCookie = decodeURIComponent(postHogCookieMatch[1])
          const postHogData = JSON.parse(decodedCookie)
          distinctId = postHogData.distinct_id
        } catch (e) {
          console.error("Error parsing PostHog cookie:", e)
        }
      }
    }

    posthog.captureException(err, distinctId || undefined)
  }
}
