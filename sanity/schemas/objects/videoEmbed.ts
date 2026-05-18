import { defineField, defineType } from "sanity"

export const videoEmbed = defineType({
  name: "videoEmbed",
  title: "Video",
  type: "object",
  fields: [
    defineField({
      name: "file",
      title: "Video File (legacy — Sanity)",
      description:
        "MP4 only (H.264 + AAC). Other formats — including .mov, .webm, and HEVC-encoded .mp4 — fail to decode on iOS Safari.",
      type: "file",
      options: { accept: "video/mp4,.mp4" },
      deprecated: {
        reason:
          'Migrating to Mux. Use the "muxVideo" field below for new uploads.'
      }
    }),
    defineField({
      name: "muxVideo",
      title: "Video (Mux)",
      type: "mux.video"
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
