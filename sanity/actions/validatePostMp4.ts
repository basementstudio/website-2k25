import type { DocumentActionComponent } from "sanity"

type VideoEmbedBlock = {
  _type: "videoEmbed"
  _key?: string
  file?: { asset?: { _ref?: string } }
}

type ContentBlock = VideoEmbedBlock | { _type: string; _key?: string }

const isFinalizedRef = (ref: string) =>
  /^file-[a-f0-9]{40}-[a-z0-9]+$/i.test(ref)

const findInvalidVideos = (content: ContentBlock[] | undefined): string[] => {
  if (!content) return []
  const errors: string[] = []
  content.forEach((block, index) => {
    if (block._type !== "videoEmbed") return
    const ref = (block as VideoEmbedBlock).file?.asset?._ref
    const position = `Video block #${index + 1}`
    if (!ref) {
      errors.push(`${position}: missing file`)
      return
    }
    if (isFinalizedRef(ref) && !ref.endsWith("-mp4")) {
      errors.push(
        `${position}: must be .mp4 (H.264 + AAC). Re-encode and re-upload.`
      )
    }
  })
  return errors
}

export const createValidatePostMp4Action = (
  originalAction: DocumentActionComponent
): DocumentActionComponent => {
  const WrappedAction: DocumentActionComponent = (props) => {
    const result = originalAction(props)
    if (!result) return result

    const doc = props.draft ?? props.published
    const content = (doc as { content?: ContentBlock[] } | null)?.content
    const errors = findInvalidVideos(content)

    if (errors.length === 0) return result

    return {
      ...result,
      disabled: true,
      title: errors.join("\n"),
      label: result.label ?? "Publish"
    }
  }

  WrappedAction.action = originalAction.action
  return WrappedAction
}
