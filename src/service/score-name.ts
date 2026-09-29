import { Filter } from "bad-words"

export const BLOCKED_SCORE_NAME_MESSAGE = "Please choose different initials."

// Basketball-specific exclusions; keep the chat filter's policy separate.
const filter = new Filter()
filter.addWords("gay", "dik")

export const isBlockedScoreName = (name: string) => filter.isProfane(name)
