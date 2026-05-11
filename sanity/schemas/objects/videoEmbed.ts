import { defineField, defineType } from "sanity"

export const videoEmbed = defineType({
  name: "videoEmbed",
  title: "Video",
  type: "object",
  fields: [
    defineField({
      name: "file",
      title: "Video File",
      description:
        "MP4 only (H.264 + AAC). Other formats — including .mov, .webm, and HEVC-encoded .mp4 — fail to decode on iOS Safari.",
      type: "file",
      options: { accept: "video/mp4,.mp4" },
      validation: (rule) =>
        rule.custom((value: { asset?: { _ref?: string } } | undefined) => {
          if (!value?.asset?._ref) return "Video file is required"
          const ref = value.asset._ref
          if (!ref.endsWith("-mp4")) {
            return "Only .mp4 files are allowed (H.264 + AAC). Re-encode and re-upload."
          }
          return true
        })
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string"
    })
  ],
  preview: {
    select: { caption: "caption" },
    prepare({ caption }) {
      return { title: caption || "Video" }
    }
  }
})
