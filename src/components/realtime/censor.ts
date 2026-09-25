import { Filter } from "bad-words"

// Imported only from realtime-impl and via dynamic import from the cursor
// chat, so bad-words stays out of the initial chunk. Applied on send and on
// receive — remote clients can't be trusted.
const filter = new Filter()

export const censor = (text: string) => {
  try {
    return filter.clean(text)
  } catch {
    // bad-words has choked on exotic input before; never let the filter
    // take the chat down with it
    return text
  }
}
