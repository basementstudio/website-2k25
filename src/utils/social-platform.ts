// The CMS platform field still says "Twitter"; the site brands it 𝕏.
const X_GLYPH = "𝕏"

export const displayPlatform = (platform: string) =>
  /twitter|^x$/i.test(platform) ? X_GLYPH : platform

// 𝕏 is U+1D54F, which screen readers skip — HTML callers hide the glyph and
// expose this instead.
export const platformAriaLabel = (platform: string) =>
  displayPlatform(platform) === X_GLYPH ? "X (Twitter)" : platform
