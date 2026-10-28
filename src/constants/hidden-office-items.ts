import type { Object3D } from "three"

// Temporarily removed from the scene. Keep the assets and metadata so each
// item can be restored on reload by removing its name here. The USAvionix SOTD award
// is a separate object and remains on display.
export const HIDDEN_OFFICE_ITEMS = new Set([
  "SM_USAVIONIX",
  "SM_Starship",
  "Ipod-body"
])

export const isHiddenOfficeItem = (object: Object3D): boolean => {
  for (let node: Object3D | null = object; node; node = node.parent) {
    if (HIDDEN_OFFICE_ITEMS.has(node.name)) return true
  }
  return false
}
