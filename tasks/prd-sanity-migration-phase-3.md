# PRD: Sanity Migration Phase 3 -- Frontend Data Source Switch

## Introduction

Switch the frontend data source from BaseHub CMS to Sanity CMS. The Sanity schemas, data migration, and studio are already complete (Phase 2). This phase replaces all BaseHub data fetching in the frontend with GROQ queries against Sanity, migrates rich text rendering from BaseHub's `RichText` to Portable Text, and removes the BaseHub SDK entirely.

The migration proceeds incrementally -- page by page, section by section -- so each stage can be verified before moving to the next.

## Goals

- Replace all BaseHub `client().query()` and `Pump` calls with `sanityFetch()` + GROQ queries
- Migrate rich text rendering from `basehub/react-rich-text` to `@portabletext/react`
- Migrate code blocks from `basehub/react-code-block` to a standalone syntax highlighting solution
- Migrate images from BaseHub CDN URLs to Sanity image references via `urlFor()`
- Maintain full visual and functional parity with the current site
- Support Sanity draft mode preview (already wired up via `SanityLive` + `VisualEditing`)
- Remove the `basehub` package and all related configuration after full migration

## User Stories

### US-001: Foundation -- Shared Infrastructure

**Description:** As a developer, I need shared utilities and types for Sanity data fetching so that all subsequent page migrations use consistent patterns.

**Acceptance Criteria:**
- [ ] Add `cdn.sanity.io` to `next.config.ts` `images.remotePatterns`
- [ ] Create `src/service/sanity/queries.ts` with reusable GROQ fragments for images (`{ asset->{ url, metadata { dimensions { width, height }, lqip } }, alt }`) and videos
- [ ] Create `src/service/sanity/types.ts` with shared TypeScript types: `SanityImage`, `SanityVideo`, `SanitySlug`, `PortableTextBlock`
- [ ] Create `src/components/primitives/portable-text.tsx` wrapper component that mirrors the current `RichText` wrapper's default styling (links, paragraphs, lists, strikethrough) using `@portabletext/react`
- [ ] Create `src/service/sanity/helpers.ts` with `getImageUrl(image: SanityImage)` helper that returns `{ src, width, height, blurDataURL }` compatible with the current `IMAGE_FRAGMENT` shape
- [ ] Verify `sanityFetch` works correctly with draft mode enabled and disabled
- [ ] Verify `SANITY_API_READ_TOKEN` env var name matches what `sanityFetch` expects (code references `SANITY_API_READ_TOKEN`, env file has `SANITY_READ_TOKEN`)
- [ ] Typecheck passes (`bun run typecheck`)

---

### US-002: Homepage Migration

**Description:** As a visitor, I want the homepage to render from Sanity data so that content updates in Sanity Studio are reflected on the site.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/(home)/sanity.ts` with GROQ queries replacing `basehub.ts`:
  - Query `homepage` singleton for `introTitle`, `introSubtitle`, `capabilities`, `featuredProjects[]->{...}`
  - Query `client` documents for brands section
  - Query `projectCategory` documents for capabilities section
- [ ] Update `page.tsx` to import from `sanity.ts` instead of `basehub.ts`
- [ ] Update `intro.tsx` to use `PortableText` instead of `RichText` for title/subtitle
- [ ] Update `brands.tsx` to use Sanity image URLs via `urlFor()` for client logos
- [ ] Update `featured-projects.tsx` to use Sanity image/video data with dereferenced project covers and categories
- [ ] Update `capabilities.tsx` to use `PortableText` for intro text and Sanity project categories
- [ ] All prop types updated to match Sanity data shapes
- [ ] `generateMetadata()` updated to query Sanity
- [ ] Delete `src/app/(site)/(pages)/(home)/basehub.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser

---

### US-003: Blog Index Migration

**Description:** As a visitor, I want the blog listing page to render from Sanity data so that new posts published in Sanity appear on the blog.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/blog/sanity.ts` with GROQ queries replacing `basehub.ts`:
  - `fetchPosts(category?)`: query `post` documents ordered by `date desc`, with category filter, skip 1 for featured, include `categories[]->{title, slug}`, `authors[]->{title}`, `heroImage`, `heroVideo`, `intro`
  - `fetchFeaturedPost()`: query first `post` document ordered by `date desc`
  - `fetchCategories()`: query `postCategory` documents
  - `fetchCategoriesNonEmpty()`: query categories that have at least one post referencing them
- [ ] Update `blog/layout.tsx`: replace `hero.tsx` and `featured.tsx` BaseHub calls with Sanity queries
- [ ] Update `blog/hero.tsx` to get post count from Sanity
- [ ] Update `blog/featured.tsx` to use Sanity data and `PortableText` for intro
- [ ] Update `src/components/blog/categories/index.tsx` to use Sanity category data
- [ ] Update `src/components/blog/list/index.tsx` to use Sanity post data
- [ ] Update `blog/[[...slug]]/page.tsx` `generateMetadata()` to query Sanity
- [ ] Delete `src/app/(site)/(pages)/blog/basehub.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- post list, category filtering, featured post

---

### US-004: Blog Post Detail Migration

**Description:** As a visitor, I want individual blog posts to render from Sanity data, including rich text content with embedded code blocks, quotes, sandboxes, and galleries.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/post/[slug]/sanity.ts` with GROQ query replacing `query.ts`:
  - Query `post` document by slug with full `content` (Portable Text with custom blocks: `codeBlock`, `quoteWithAuthor`, `codeSandbox`, `sideNote`, `gridGallery`, `tweetEmbed`)
  - Query related posts (latest 3 excluding current)
  - Query all `postCategory` documents (for category display)
- [ ] Replace `Pump` in `page.tsx` with `sanityFetch()` call, pass data as props
- [ ] Update `title.tsx` to use Sanity post data
- [ ] Update `content.tsx`:
  - Replace `basehub/react-rich-text` `RichText` with `@portabletext/react` `PortableText`
  - Create Portable Text serializers for custom block types: `codeBlock`, `quoteWithAuthor`, `codeSandbox`, `sideNote`, `gridGallery`, `tweetEmbed`
- [ ] Replace `basehub/react-code-block` with `shiki` for server-side syntax highlighting in code block serializer
- [ ] Update `more.tsx` to use Sanity data for related posts
- [ ] Update `generateStaticParams()` and `generateMetadata()` to query Sanity
- [ ] Delete `src/app/(site)/(pages)/post/[slug]/query.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- rich text rendering, code blocks with syntax highlighting, quotes, galleries, tweet embeds

---

### US-005: Showcase Index Migration

**Description:** As a visitor, I want the showcase/project gallery to render from Sanity data with filtering by category.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/showcase/sanity.ts` with GROQ queries replacing `basehub.ts`:
  - `fetchProjects()`: query `showcasePage` singleton, dereference `projects[]->` with `title`, `slug`, `client->{title}`, `year`, `categories[]->{title, slug}`, `cover`, `coverVideo`, `icon`, `showcase[0..5]{image, video}`
  - `fetchCategories()`: query `projectCategory` documents with `title`, `slug`
  - `fetchProjectsCount()`: count query for hero
- [ ] Update `showcase/page.tsx` to import from `sanity.ts`
- [ ] Update `showcase/hero.tsx` to get project count from Sanity
- [ ] Update `showcase/showcase-list/index.tsx` to use Sanity data
- [ ] Update `showcase/list.tsx`, `showcase/grid.tsx`, `showcase/filters.tsx` prop types for Sanity data shapes
- [ ] Update image rendering to use `urlFor()` for covers, icons, and gallery images
- [ ] Delete `src/app/(site)/(pages)/showcase/basehub.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- grid/list views, category filtering, image/video rendering

---

### US-006: Showcase Detail Migration

**Description:** As a visitor, I want individual project detail pages to render from Sanity data with full project info, gallery, team, and awards.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/showcase/[slug]/sanity.ts` with GROQ queries:
  - Query project by slug from `showcasePage.projects[]->` with full data: `client->{title, website}`, `year`, `categories[]->{title}`, `projectWebsite`, `content`, `caseStudy`, `people[]->{title, department->{title}}`, `cover`, `icon`, `showcase[]{image, video}`
  - Query `award` documents where `project._ref == projectId`
- [ ] Replace `Pump` in `page.tsx` with `sanityFetch()` call
- [ ] Update `wrapper.tsx` and child components to use Sanity data shapes
- [ ] Update `PortableText` for project content body
- [ ] Update image/video rendering to use `urlFor()`
- [ ] Update `generateStaticParams()` and `generateMetadata()` to query Sanity
- [ ] Delete `src/app/(site)/(pages)/showcase/[slug]/query.ts` and `basehub.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- project detail, gallery, team section, awards

---

### US-007: Services Page Migration

**Description:** As a visitor, I want the services page to render from Sanity data including service categories, testimonials, awards, ventures, and team info.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/services/sanity.ts` with GROQ queries:
  - Query `servicesPage` singleton for `intro`, `heroImage`, `ventures`, `serviceCategories`
  - Query `person` documents with `department->{title}`, `role`
  - Query `award` documents with `project->{title}`, `certificate`, ordered by `date desc`
  - Query `testimonial` documents for services section
- [ ] Replace `Pump` in `page.tsx` with `sanityFetch()` call, pass data as props to child components
- [ ] Update `hero.tsx` to use `PortableText` for intro, `urlFor()` for hero image
- [ ] Update `services.tsx` to use `PortableText` for service descriptions, Sanity people data
- [ ] Update `testimonials.tsx` to use Sanity testimonial data with `urlFor()` for avatars
- [ ] Update `awards.tsx` to use Sanity award data with `urlFor()` for certificates
- [ ] Update `ventures.tsx` to use `PortableText` and `urlFor()` for ventures content
- [ ] Delete `src/app/(site)/(pages)/services/query.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- all sections render correctly

---

### US-008: People Page Migration

**Description:** As a visitor, I want the people/about page to render from Sanity data including team members, values, and open positions.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/people/sanity.ts` with GROQ queries:
  - Query `peoplePage` singleton for `title`, `subheading1`, `subheading2`, `preOpenPositionsSideImages`, `preOpenPositionsText`
  - Query `person` documents with `department->{title}`, `role`, `image`, `socialNetworks[]`
  - Query `value` documents with `title`, `description`, `image`
  - Query `openPosition` documents where `isOpen == true` with `title`, `slug`, `type`, `location`, `applyUrl`
- [ ] Replace `Pump` in `page.tsx` with `sanityFetch()` call
- [ ] Update `hero.tsx` to use `PortableText` for subheadings
- [ ] Update `crew.tsx` to use Sanity people data with `urlFor()` for images
- [ ] Update `values.tsx` to use `PortableText` for descriptions, `urlFor()` for images
- [ ] Update `pre-open-positions.tsx` to use `PortableText` and `urlFor()` for side images
- [ ] Update `open-positions.tsx` to use Sanity position data
- [ ] Delete `src/app/(site)/(pages)/people/query.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- team grid, values, positions list

---

### US-009: Careers Post Migration

**Description:** As a visitor, I want individual career/job posting pages to render from Sanity data with job details and application form.

**Acceptance Criteria:**
- [ ] Create `src/app/(site)/(pages)/careers/[slug]/sanity.ts` with GROQ queries:
  - Query `careersPostPage` singleton for `heroTitle`
  - Query `openPosition` document by slug with `title`, `type`, `employmentType`, `location`, `isOpen`, `applyUrl`, `jobDescription`, `applyFormSetup{formFields, skills[]{title, slug}}`
- [ ] Replace `Pump` in `page.tsx` with `sanityFetch()` call
- [ ] Update job description rendering to use `PortableText`
- [ ] Update application form to use Sanity form field configuration
- [ ] Update `generateStaticParams()` and `generateMetadata()` to query Sanity
- [ ] Delete `src/app/(site)/(pages)/careers/[slug]/query.ts`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- job details, description, application form

---

### US-010: Navbar, Footer, and Contact Footer Migration

**Description:** As a visitor, I want the site navigation and footer to render from Sanity data including project/post counts and social links.

**Acceptance Criteria:**
- [ ] Create `src/components/layout/sanity.ts` with GROQ queries replacing `query.tsx`:
  - Count query for showcase projects: `count(*[_type == "project"])` (or from `showcasePage.projects`)
  - Count query for blog posts: `count(*[_type == "post"])`
  - Query `companyInfo` singleton for `github`, `instagram`, `twitter`, `linkedIn`, `newsletter`
- [ ] Update `navbar.tsx`: replace `Pump` with `sanityFetch()`, pass data as props to `<NavbarContent>`
- [ ] Update `footer.tsx`: replace `Pump` with `sanityFetch()`, pass data as props to `<FooterContent>`
- [ ] Update `contact-footer.tsx`: replace `Pump` with `sanityFetch()` for social links
- [ ] Update `PortableText` for newsletter content in navbar
- [ ] Delete `src/components/layout/query.tsx`
- [ ] Typecheck passes
- [ ] Visual parity verified in browser -- navbar counts, social links, footer content

---

### US-011: Laboratory / Arcade Screen Migration

**Description:** As a visitor, I want the lab project list (shown on the arcade screen) to render from Sanity data.

**Acceptance Criteria:**
- [ ] Create `src/actions/laboratory-fetch/sanity.ts` with GROQ query:
  - Query `labProject` documents with `title`, `url`, `description`, `cover`
- [ ] Update `src/actions/laboratory-fetch/index.ts` to use `sanityFetch()` instead of `basehub()` client
- [ ] Update image handling for lab project covers to use `urlFor()`
- [ ] Delete old BaseHub fetch logic from the action
- [ ] Typecheck passes

---

### US-012: 3D Assets Provider Migration

**Description:** As a developer, I need the 3D asset provider to fetch all WebGL assets from Sanity so the 3D scene renders correctly.

**Acceptance Criteria:**
- [ ] Create `src/components/assets-provider/sanity.ts` with GROQ queries:
  - Query `threeDAssets` singleton for all fields: models (office, outdoor, godrays, basketball, etc.), bakes, matcaps, glassMaterials, doubleSideElements, glassReflexes, arcade textures, videos, characters, pets, lamp, mapTextures, physicsParams, sfx, specialEvents
  - Query inspectables from `threeDAssets.inspectables[]` with all fields including `description` (Portable Text), `specs`, mesh names, offsets, scenes, fx
  - Query `threeDAssets.scenes[]` with camera configs, tabs, postprocessing params
- [ ] Create `src/components/assets-provider/fetch-assets-sanity.ts` that returns the same `AssetsResult` interface shape currently expected by the 3D layer
- [ ] Map Sanity file asset URLs (`asset->url`) to the plain URL strings the 3D layer expects
- [ ] Map Sanity image references to URLs for textures via `urlFor()`
- [ ] Update `src/components/assets-provider/fetch-assets.ts` to call the Sanity version
- [ ] Update inspectable descriptions to use `PortableText` where rendered
- [ ] Delete `src/components/assets-provider/fragments.ts` (BaseHub fragments)
- [ ] Delete `src/components/assets-provider/query.ts` (BaseHub query)
- [ ] Typecheck passes
- [ ] 3D scene loads correctly -- models, textures, audio, scenes, inspectables all functional

---

### US-013: BaseHub Removal and Cleanup

**Description:** As a developer, I want all BaseHub dependencies and configuration removed so the codebase has a single CMS dependency.

**Acceptance Criteria:**
- [ ] Remove `basehub` from `package.json` dependencies
- [ ] Remove `basehub dev &` from `dev` script, update to just `next dev --webpack`
- [ ] Remove `basehub &&` from `build` script, update to just `next build --webpack`
- [ ] Delete `src/service/basehub/` directory (client singleton + shared fragments)
- [ ] Delete `scripts/migration/` directory entirely
- [ ] Remove `basehub-types.d.ts` and `basehub.config.ts` from `tsconfig.json` includes
- [ ] Remove `.basehub` from `.gitignore`
- [ ] Remove `assets.basehub.com` and `basehub.earth` from `next.config.ts` `images.remotePatterns`
- [ ] Remove `BASEHUB_TOKEN` from `.env.local`
- [ ] Verify no remaining imports from `basehub`, `basehub/react-pump`, `basehub/react-rich-text`, `basehub/react-code-block`, or `basehub/api-transaction` in any source file
- [ ] Run `bun install` to update lockfile
- [ ] Typecheck passes
- [ ] Build succeeds (`bun run build`)
- [ ] Full site smoke test -- every page loads, no console errors referencing BaseHub

---

## Functional Requirements

- FR-1: All GROQ queries must return data shapes compatible with existing component prop interfaces (or prop interfaces must be updated to match)
- FR-2: `sanityFetch()` must be used for all data fetching, with `tags` parameter for ISR cache invalidation
- FR-3: Draft mode must work via existing `SanityLive` + `VisualEditing` infrastructure -- no real-time streaming required, page refresh to see draft changes is acceptable
- FR-4: Images from Sanity must use `urlFor()` for URL generation, supporting width/height/format transformations
- FR-5: File assets (3D models, audio, textures) must use the Sanity CDN file URL (`asset->url`)
- FR-6: Portable Text rendering must support all custom block types used in blog posts: `codeBlock`, `quoteWithAuthor`, `codeSandbox`, `sideNote`, `gridGallery`, `tweetEmbed`
- FR-7: `generateStaticParams()` functions must query Sanity for all slugs to enable static generation
- FR-8: `generateMetadata()` functions must query Sanity for page titles and OG data
- FR-9: Blog category filtering must work with Sanity references (filter posts by category slug)
- FR-10: Showcase project filtering must work with Sanity category references
- FR-11: Each migration stage must be independently deployable -- partially migrated states must not break the site

## Non-Goals (Out of Scope)

- Real-time streaming updates (BaseHub `Pump` equivalent) -- draft mode preview via refresh is sufficient
- Content model changes in Sanity -- schemas are already complete from Phase 2
- Migration scripts -- data is already migrated from Phase 2
- New features or design changes -- this is a 1:1 data source swap
- Automated testing -- manual visual verification per stage
- Performance optimization beyond parity -- no regression is the bar
- ~~Removing migration scripts~~ — `scripts/migration/` will be deleted in US-013

## Technical Considerations

### Data Shape Differences

| Aspect | BaseHub | Sanity | Migration Impact |
|--------|---------|--------|-----------------|
| Rich text | JSON AST (`RichTextNode`) | Portable Text blocks | New serializers needed |
| Images | Direct URL strings | Reference objects (`{ asset: { _ref } }`) | Use `urlFor()` everywhere |
| Files (3D) | Direct URL strings | File references (`{ asset: { _ref } }`) | Dereference to get URL |
| References | Inline expansion via fragment | Requires explicit `->` dereference in GROQ | Query complexity increases |
| Filtering | SDK filter params (`filter`, `orderBy`) | GROQ `*[_type == "x" && ...]` | More expressive but different syntax |
| Counts | `_meta.filteredCount` | `count(...)` GROQ function | Separate query or subquery |
| Code blocks | `basehub/react-code-block` component | No built-in -- needs `shiki` or `prism-react-renderer` | New dependency needed |

### Environment Variables

| Variable | Status |
|----------|--------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Already set (`9syto90m`) |
| `NEXT_PUBLIC_SANITY_DATASET` | Already set (`production`) |
| `SANITY_API_READ_TOKEN` / `SANITY_READ_TOKEN` | Exists but name may mismatch -- verify in US-001 |
| `BASEHUB_TOKEN` | Remove in US-013 |

### Key Files to Create

| File | Purpose |
|------|---------|
| `src/service/sanity/queries.ts` | Reusable GROQ fragments |
| `src/service/sanity/types.ts` | Shared TypeScript types |
| `src/service/sanity/helpers.ts` | Image/file URL helpers |
| `src/components/primitives/portable-text.tsx` | PortableText wrapper with default styling |
| `src/app/(site)/(pages)/*/sanity.ts` | Per-page GROQ queries (one per page) |

### Key Files to Delete (after full migration)

| File | Replaced By |
|------|-------------|
| `src/service/basehub/index.ts` | `src/service/sanity/index.ts` (existing) |
| `src/service/basehub/fragments.ts` | `src/service/sanity/queries.ts` |
| `src/components/primitives/rich-text.tsx` | `src/components/primitives/portable-text.tsx` |
| `src/app/(site)/(pages)/*/basehub.ts` | `src/app/(site)/(pages)/*/sanity.ts` |
| `src/app/(site)/(pages)/*/query.ts` | `src/app/(site)/(pages)/*/sanity.ts` |
| `src/components/layout/query.tsx` | `src/components/layout/sanity.ts` |
| `src/components/assets-provider/fragments.ts` | `src/components/assets-provider/sanity.ts` |
| `src/components/assets-provider/query.ts` | `src/components/assets-provider/sanity.ts` |

### Dependencies

| Package | Action |
|---------|--------|
| `basehub` | Remove after US-013 |
| `@portabletext/react` | Already installed (`^6.0.3`) |
| `@portabletext/types` | Already installed (`^4.0.2`) |
| `@sanity/client` | Already installed (`^7.20.0`) |
| `@sanity/image-url` | Already installed (`^2.0.3`) |
| `next-sanity` | Already installed (`^12.1.6`) |
| `shiki` | Add for server-side code block syntax highlighting (replaces `basehub/react-code-block`) |

## Success Metrics

- Zero visual regressions -- every page renders identically to the BaseHub version
- `basehub` package fully removed from `package.json`
- No remaining imports from `basehub` or its sub-modules in any source file
- Build succeeds without BaseHub SDK codegen step
- Draft mode preview works via Sanity's existing infrastructure
- No increase in page load time (TTFB, LCP) beyond normal variance

## Resolved Questions

- **Code block syntax highlighter:** Use `shiki` (server-side, zero client JS). Recommended for RSC-heavy apps.
- **Migration scripts:** Delete `scripts/migration/` directory in US-013 cleanup.
- **Cache tags:** Follow Sanity/Next.js best practices — use document-type-based tags (e.g., `post`, `project`, `person`) for granular ISR revalidation via `revalidateTag()`.
- **Blog "skip 1" logic:** The featured post is the latest post shown as a hero. The post list excludes it via GROQ filter `_id != $featuredId` to avoid duplication.
