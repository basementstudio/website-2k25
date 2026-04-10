# PRD: Sanity Migration Phase 2 -- Schema Fixes, Presentation Tool & Asset Upload

## Introduction

The website-2k25 project is migrating from BaseHub CMS to Sanity. Phase 1 migrated core content (projects, people, blog posts, awards, careers, etc.) but left data quality issues and missing tooling. This phase fixes incorrect migration data, adds the Sanity presentation tool with full visual editing, and uploads all 3D/media assets into Sanity's native file storage. The frontend continues to read from BaseHub for now -- this phase focuses on getting Sanity data correct and complete.

## Goals

- Fix award documents so titles contain actual award names (e.g. "Awwwards Site of the Day") instead of BaseHub internal identifiers
- Fix open position schema so form field configuration is stored as an array (matching BaseHub source and frontend expectations)
- Configure Sanity presentation tool with draft mode and visual editing overlays for live content preview
- Upload all 3D models, textures, audio, and video files into Sanity's CDN via native file storage
- Add missing Sanity schemas for scenes, inspectables, and physicsParams data
- Keep BaseHub as the active frontend data source -- no frontend query changes in this phase

## User Stories

### US-001: Fix Award Titles in Sanity
**Description:** As a content editor, I want award titles in Sanity to show the actual award name (e.g. "Awwwards Site of the Day") so that when we switch the frontend to Sanity, awards display correctly.

**Acceptance Criteria:**
- [ ] Migration script `fix-awards.ts` queries `title: true` from BaseHub (not just `_title`)
- [ ] Migration script writes `award.title` (the SELECT field value) to Sanity, falling back to `award._title`
- [ ] Re-running the migration replaces all award documents with correct titles
- [ ] GROQ query `*[_type == "award"]{title}` returns names like "Awwwards Site of the Day", "FWA Site of the Day", "Webby Award" -- not internal slugs
- [ ] Typecheck passes

### US-002: Fix Open Position formFields Schema
**Description:** As a content editor, I want the form fields configuration for open positions to be a multi-select list in Sanity Studio so I can pick which fields appear on each job application form.

**Acceptance Criteria:**
- [ ] `formFields` field in `openPosition` schema changed from `type: 'string'` to `type: 'array'` of strings with predefined options list
- [ ] Predefined options match BaseHub values: "First and last name", "Email", "Where are you based", "Why do you want to join", "Years of experience", "Skills", "Portfolio", "Github", "Availability to start", "Availability to work", "Linkedin", "Salary Expectation"
- [ ] Re-running careers migration stores formFields as an array in Sanity
- [ ] GROQ query `*[_type == "openPosition"]{title, "fields": applyFormSetup.formFields}` returns `fields` as an array of strings
- [ ] Sanity Studio shows a tag/checkbox picker for form field selection (not a free text input)
- [ ] Typecheck passes

### US-003: Add Presentation Tool to Sanity Studio
**Description:** As a content editor, I want a Presentation tab in Sanity Studio that shows a live preview of the website so I can see content changes in context.

**Acceptance Criteria:**
- [ ] `presentationTool` imported from `sanity/presentation` and added to `sanity.config.ts` plugins
- [ ] "Presentation" tab appears in Sanity Studio alongside "Structure" and "Vision"
- [ ] Clicking Presentation loads the website in an iframe preview panel
- [ ] Typecheck passes

### US-004: Set Up Draft Mode API Routes
**Description:** As a developer, I need draft mode enable/disable API routes so the presentation tool can toggle Next.js draft mode for live previews.

**Acceptance Criteria:**
- [ ] `GET /api/draft-mode/enable` enables Next.js draft mode and redirects to the provided `redirect` query param (defaults to `/`)
- [ ] `GET /api/draft-mode/disable` disables Next.js draft mode and returns a JSON response
- [ ] Draft mode enable endpoint includes token validation using a shared secret (env var `SANITY_VIEWER_TOKEN` or similar) to prevent unauthorized access
- [ ] Typecheck passes

### US-005: Configure Visual Editing Overlays
**Description:** As a content editor, I want clickable overlays on page elements in the presentation preview so I can click any piece of content and jump directly to editing it in Sanity Studio.

**Acceptance Criteria:**
- [ ] `VisualEditing` component from `next-sanity` added to the site layout (only active when draft mode is enabled)
- [ ] `sanityFetch` updated to support draft perspective: uses `previewDrafts` perspective when draft mode is on, `published` when off
- [ ] `SanityLive` component or `defineLive` configured for real-time content updates in preview mode
- [ ] When in presentation mode, hovering over Sanity-sourced content shows edit overlays
- [ ] Clicking an overlay opens the corresponding document in Studio's structure tool
- [ ] Typecheck passes

### US-006: Update threeDAssets Schema to Use File Type
**Description:** As a developer, I need the threeDAssets Sanity schema to use native `file` type instead of `url` type so that uploaded assets are stored in Sanity's CDN.

**Acceptance Criteria:**
- [ ] All `type: 'url'` fields in `threeDAssets.ts` changed to `type: 'file'` (approximately 60+ fields)
- [ ] Schema covers: top-level models, specialEvents, bakes, matcaps, glassReflexes, arcade, characters, pets, lamp, mapTextures, sfx, videos
- [ ] Schema deploys without errors (verify via Sanity Studio loading cleanly)
- [ ] Typecheck passes

### US-007: Create File Upload Migration Utility
**Description:** As a developer, I need a reusable utility function that downloads a file from a URL and uploads it to Sanity's asset storage.

**Acceptance Criteria:**
- [ ] `downloadAndUploadFile(url, filename)` function created in `scripts/migration/utils/files.ts`
- [ ] Downloads file from external URL into a buffer
- [ ] Uploads buffer to Sanity via `sanityWriteClient.assets.upload('file', buffer, { filename })`
- [ ] Returns Sanity file reference object `{ _type: 'file', asset: { _type: 'reference', _ref: assetId } }`
- [ ] Returns `null` for empty/undefined URLs (does not throw)
- [ ] Logs progress and errors per file
- [ ] Typecheck passes

### US-008: Migrate 3D Assets to Sanity File Storage
**Description:** As a developer, I need a migration script that reads the current threeDAssets document URLs and re-uploads each file to Sanity's CDN as native file assets.

**Acceptance Criteria:**
- [ ] Migration script at `scripts/migration/migrate-3d-assets-to-files.ts`
- [ ] Fetches current `threeDAssets` document from Sanity to get existing URL values
- [ ] Downloads and uploads each file using the utility from US-007
- [ ] Builds replacement document with file references for all asset fields
- [ ] Uses `createOrReplace` to store updated document
- [ ] Includes rate limiting (small delay between uploads to respect Sanity API limits)
- [ ] Continues on individual file failures (logs which fields failed, doesn't abort)
- [ ] Prints summary: total files attempted, succeeded, failed
- [ ] GROQ query `*[_type == "threeDAssets"][0]{"officeUrl": office.asset->url}` resolves to a valid CDN URL
- [ ] Typecheck passes

### US-009: Add Scenes Schema and Migration
**Description:** As a developer, I need scenes data (camera configs, tabs, postprocessing) stored in Sanity so it can eventually replace the BaseHub source.

**Acceptance Criteria:**
- [ ] `scenes` field added to `threeDAssets` schema as an array of objects
- [ ] Each scene object has: `name` (string), `cameraConfig` (object with `posX/posY/posZ/tarX/tarY/tarZ` numbers, `fov` number, `targetScrollY` number, `offsetMultiplier` number), `tabs` (array of objects with `tabName/tabRoute/tabHoverName/tabClickableName` strings + `plusShapeScale` number), `postprocessing` (object with `contrast/brightness/exposure/gamma/vignetteRadius/vignetteSpread/bloomStrength/bloomRadius/bloomThreshold` numbers)
- [ ] Migration script fetches scenes from BaseHub and creates them in Sanity
- [ ] GROQ query returns scenes data matching the `AssetsResult["scenes"]` shape
- [ ] Typecheck passes

### US-010: Add Inspectables Schema and Migration
**Description:** As a developer, I need inspectable objects data stored in Sanity so it can eventually replace the BaseHub source.

**Acceptance Criteria:**
- [ ] `inspectables` field added to `threeDAssets` schema (or as a separate document type) as an array of objects
- [ ] Each inspectable has: `title` (string), `specs` (array of `{title, value}` objects), `description` (portable text or text), `mesh` (string), `xOffset/yOffset/xRotationOffset/sizeTarget` (numbers), `scenes` (array of strings), `fx` (file)
- [ ] Migration script fetches inspectables from BaseHub and creates them in Sanity
- [ ] `fx` fields uploaded as Sanity file assets (not stored as URLs)
- [ ] Typecheck passes

### US-011: Add PhysicsParams and String Arrays to Schema
**Description:** As a developer, I need physicsParams, glassMaterials, and doubleSideElements data in Sanity.

**Acceptance Criteria:**
- [ ] `physicsParams` field added to `threeDAssets` schema as array of `{ title: string, value: number }`
- [ ] `glassMaterials` field added as array of strings
- [ ] `doubleSideElements` field added as array of strings
- [ ] Migration script fetches these from BaseHub and stores in Sanity
- [ ] Typecheck passes

## Functional Requirements

- FR-1: The `fix-awards.ts` migration script must query the BaseHub `title` SELECT field and write it to Sanity's `title` field
- FR-2: The `openPosition` Sanity schema must store `formFields` as `type: 'array'` of strings with a predefined options list matching the 12 BaseHub SELECT values
- FR-3: The `sanity.config.ts` must include `presentationTool` with a preview URL pointing to `/api/draft-mode/enable`
- FR-4: Draft mode enable route must validate requests with a shared secret before enabling draft mode
- FR-5: The `VisualEditing` component must only render when Next.js draft mode is active
- FR-6: The `sanityFetch` function must use `previewDrafts` perspective when draft mode is on, `published` perspective when off
- FR-7: All `type: 'url'` fields in `threeDAssets.ts` must be changed to `type: 'file'`
- FR-8: The file upload utility must handle `null`/`undefined` URLs gracefully (return `null`, no throw)
- FR-9: The 3D asset migration script must include rate limiting between uploads
- FR-10: The 3D asset migration script must continue on individual failures and report a summary
- FR-11: Scene, inspectable, and physicsParams schemas must match the shape expected by `AssetsResult` in `fetch-assets.ts`
- FR-12: All migration scripts must be idempotent (safe to re-run via `createOrReplace`)

## Non-Goals

- Switching the frontend from BaseHub to Sanity queries (this phase is data/tooling only)
- Modifying `fetchAssets()` or any frontend components to read from Sanity
- Removing BaseHub dependencies or code
- Adding revalidation webhooks for Sanity content changes
- Full CDN performance optimization or caching strategy for Sanity-hosted assets
- Migrating blog post content or other non-3D assets

## Technical Considerations

- **Sanity v5.18+** exports `presentationTool` from `sanity/presentation` (no separate package needed)
- **next-sanity v12.1+** exports `VisualEditing` component and `defineLive` for real-time preview
- **Draft mode in Next.js 16+**: `draftMode()` returns a promise that must be awaited
- **Sanity file type**: When storing files, the document field contains `{ _type: 'file', asset: { _type: 'reference', _ref: 'file-abc123-ext' } }`. GROQ resolves to URL via `fieldName.asset->url`
- **Rate limits**: Sanity asset upload API has rate limits. The migration script should throttle to ~3 concurrent uploads max with 100ms delays
- **Asset count**: Approximately 60-80 files to upload. Expect migration to take 5-10 minutes
- **Existing data**: The `threeDAssets` document already has URL strings from phase 1 migration. Changing schema to `file` type means existing data won't match -- the migration script must run after schema deployment
- **`sanityFetch` changes**: The current implementation at `src/service/sanity/index.ts` uses `useCdn: true` and doesn't support draft mode. It needs a conditional path for preview

## Success Metrics

- All 40+ award documents in Sanity have human-readable titles (not internal BaseHub slugs)
- All open position documents store `formFields` as arrays that match the frontend's expected format
- Sanity Studio shows Presentation tab with working iframe preview
- Visual editing overlays appear on Sanity-sourced content when in draft mode
- All 3D models, textures, audio, and video files are stored as native Sanity file assets
- GROQ queries can resolve all file references to CDN URLs
- Scenes, inspectables, and physicsParams data exist in Sanity with correct schemas

## Open Questions

- What shared secret / token should be used for draft mode enable endpoint validation? Should we use an existing `SANITY_VIEWER_TOKEN` env var or create a new one?
- Should the `VisualEditing` overlay component be added to the root layout or only the `(site)` group layout?
- For inspectables: should `description` be stored as portable text (rich text) or plain text in Sanity? BaseHub stores it as rich text JSON.
