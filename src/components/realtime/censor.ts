import {
  englishDataset,
  englishRecommendedTransformers,
  RegExpMatcher,
  TextCensor
} from "obscenity"

// Imported only from realtime-impl so obscenity stays in the lazy realtime
// chunk. Applied on send and on receive — remote clients can't be trusted.
const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers
})
const textCensor = new TextCensor()

export const censor = (text: string) =>
  textCensor.applyTo(text, matcher.getAllMatches(text))
