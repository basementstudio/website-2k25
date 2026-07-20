# Project specifics

- **Next.js 16.2.10 (stable), webpack, Cache Components on.** `cacheComponents: true` + `cacheLife: { default: sanity }` in `next.config.ts`. Do not switch to Turbopack — it doesn't run this project's Tailwind v3 PostCSS pipeline or the GLSL shader loaders. `dev`/`build` use `--webpack`.
- **Sanity data has three fetch modes (`src/service/sanity/index.ts`) — pick by context:**
  - `sanityFetch` — Live; only valid **inside a `"use cache"` scope** (its `cacheTag()` throws otherwise). For draft/preview render.
  - `sanityFetchCached` — Live wrapped in `"use cache"`; the default for published page/route content. Revalidates via Sanity Live tags.
  - `sanityFetchStatic` — non-Live plain client. Use in every context that is **not** a `"use cache"` scope: `generateStaticParams`, `generateMetadata`, **server actions**, and uncached route handlers.
  - Gotcha: calling the Live `sanityFetch` outside a `"use cache"` scope 500s with `` `cacheTag()` can only be called inside a "use cache" function ``. When in doubt outside a page render, use `sanityFetchStatic`.
- **Request-time logic goes in `src/proxy.ts`, not in pages.** Reading `headers()`/`cookies()` at the top of a page forces it dynamic under Cache Components. Keep pages prerenderable; do per-request work (UA redirects, content negotiation) in the matcher-scoped proxy. Example: `/lab`'s mobile redirect lives in the proxy so the page stays static.
- **Revalidation is tag-based, not time-based.** `<SanityLive />` (root layout) invalidates cached content on publish; the 1-year `cacheLife` is only a backstop. Any new cached fetcher must route through the Sanity helpers above so its tags register.
