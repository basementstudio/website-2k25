import { track } from "@vercel/analytics/server"
import { headers } from "next/headers"

type Form = "contact" | "newsletter" | "careers"

// Not Sentry: attacker-triggerable, and error events here are unsampled.
export async function reportBotDetection(form: Form) {
  const headerList = await headers()

  // Path only — `beforeSend` doesn't scrub log arguments.
  console.error("[BotID] bot detected", {
    form,
    path: headerList.get("next-url") ?? headerList.get("referer") ?? "unknown"
  })

  // Telemetry must never fail a submission.
  await track("botid_detected", { form }, { headers: headerList }).catch(
    () => {}
  )
}
