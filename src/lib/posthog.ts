import { PostHog } from "posthog-node"

let posthogInstance: PostHog | null = null

export default function createPostHogClient() {
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0
  })
  return posthogClient
}

export function getPostHogServer() {
  if (!posthogInstance) {
    posthogInstance = createPostHogClient()
  }
  return posthogInstance
}
