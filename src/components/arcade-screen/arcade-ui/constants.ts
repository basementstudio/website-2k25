// Color theme
export const COLORS = {
  primary: "#FF4D00",
  black: "#000000"
} as const

// Outer container (matches uikit Container 590x390 with paddingX=18, paddingY=24)
export const UI_WIDTH = 590
export const UI_HEIGHT = 390
export const PADDING_X = 18
export const PADDING_Y = 24

// Inner frame (inside outer padding, with border)
export const INNER_WIDTH = UI_WIDTH - PADDING_X * 2 // 554
export const INNER_HEIGHT = UI_HEIGHT - PADDING_Y * 2 // 342
export const BORDER_WIDTH = 1.5
export const BORDER_RADIUS = 10

// Inner frame padding
export const INNER_PADDING = 10

// Content area (inside inner frame padding)
export const CONTENT_WIDTH = INNER_WIDTH - INNER_PADDING * 2 // 534
export const CONTENT_HEIGHT = INNER_HEIGHT - INNER_PADDING * 2 // 322

// Section headers
export const HEADER_HEIGHT = 10
export const HEADER_MARGIN_TOP = 8

// Content split (60/40 with gap)
export const CONTENT_GAP = 10
export const LEFT_RATIO = 0.6
export const RIGHT_RATIO = 0.4
export const LEFT_WIDTH = CONTENT_WIDTH * LEFT_RATIO - CONTENT_GAP / 2 // ~317
export const RIGHT_WIDTH = CONTENT_WIDTH * RIGHT_RATIO - CONTENT_GAP / 2 // ~207

// List items
export const LIST_ITEM_HEIGHT = 24

// Featured section
export const FEATURED_HEIGHT = 100

// Font sizes (matching uikit config)
export const FONT_SIZE_DEFAULT = 13
export const FONT_SIZE_SMALL = 10
export const FONT_SIZE_TINY = 8
export const FONT_SIZE_HEADER = 11
export const FONT_SIZE_LABEL = 9

// Camera setup for coordinate mapping
// PerspectiveCamera at z=4.01 with fov=50 (Three.js default)
export const CAMERA_Z = 4.01
export const CAMERA_FOV = 50
// Visible height at z=0: 2 * z * tan(fov/2)
export const VISIBLE_HEIGHT =
  2 * CAMERA_Z * Math.tan((CAMERA_FOV / 2) * (Math.PI / 180))
// Scale: virtual units → world units
export const WORLD_SCALE = VISIBLE_HEIGHT / UI_HEIGHT
