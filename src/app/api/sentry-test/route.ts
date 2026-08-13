import { connection } from "next/server"

// TEMPORARY — smoke test for the Sentry sourcemap pipeline on a preview deploy.
// Delete before merging.
export async function GET() {
  // Opt out of prerendering — otherwise Cache Components throws this at build time.
  await connection()
  throw new Error("Sentry preview smoke test")
}
