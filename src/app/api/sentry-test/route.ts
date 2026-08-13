// TEMPORARY — smoke test for the Sentry sourcemap pipeline on a preview deploy.
// Delete before merging.
export async function GET() {
  throw new Error("Sentry preview smoke test")
}
