import { notFound } from "next/navigation"

// Prerendered notFound() keeps the real 404 status (a streamed/request-time
// notFound() would lock the status at 200 — see loading.md "Status Codes").
// The served artifact is an empty client shell, so agent-readable 404 bodies
// are handled in src/proxy.ts instead.
export default function NotFoundCatchAll() {
  notFound()
}
