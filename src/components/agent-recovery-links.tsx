import { SITE_URL } from "@/lib/constants"

/**
 * Recovery links for the 404 responses. Rendered server-side so agents and
 * crawlers (which never hydrate the WebGL 404 scene) get a usable body with
 * pointers to the machine-readable surfaces instead of an empty shell.
 */
export function AgentRecoveryLinks({ className }: { className?: string }) {
  return (
    <section className={className}>
      <h1>404 — Page not found</h1>
      <p>
        This page does not exist on basement.studio. Useful entry points to find
        what you were looking for:
      </p>
      <ul>
        <li>
          <a href={`${SITE_URL}/sitemap.md`}>
            Content index of every page, post, and project (markdown)
          </a>
        </li>
        <li>
          <a href={`${SITE_URL}/llms.txt`}>llms.txt — curated link map</a>
        </li>
        <li>
          <a href={`${SITE_URL}/index.md`}>Homepage (markdown)</a>
        </li>
        <li>
          <a href={`${SITE_URL}/ai`}>Machine view — plain-HTML site index</a>
        </li>
        <li>
          <a href={`${SITE_URL}/openapi.json`}>
            OpenAPI description of the public API
          </a>
        </li>
      </ul>
    </section>
  )
}
