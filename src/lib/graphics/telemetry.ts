import * as Sentry from "@sentry/nextjs"

type Data = Record<string, string | number | boolean>
export function recordGraphicsTiming(
  stage: string,
  duration: number,
  data: Data = {}
) {
  Sentry.addBreadcrumb({
    category: "graphics",
    message: stage,
    data: { ...data, durationMs: duration }
  })
  const span = Sentry.startInactiveSpan({
    name: `graphics.${stage}`,
    op: "graphics",
    startTime: Date.now() / 1000 - duration / 1000,
    attributes: { ...data, "graphics.duration_ms": duration }
  })
  span.end()
}
