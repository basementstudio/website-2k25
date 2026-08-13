import { connection } from "next/server"

// TEMPORARY — verification surface for the Sentry rollout. Delete before merge.
export async function GET() {
  await connection()
  throw new Error("sentry-check: node runtime")
}
