import { defineField, defineType } from "sanity"

export const showcaseItem = defineType({
  name: "showcaseItem",
  title: "Showcase Item",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true }
    }),
    defineField({
      name: "video",
      title: "Video (legacy — Sanity)",
      type: "file",
      options: { accept: "video/mp4,video/webm" },
      deprecated: {
        reason:
          'Migrating to Mux. Use the "muxVideo" field below for new uploads.'
      }
    }),
    defineField({
      name: "muxVideo",
      title: "Video (Mux)",
      type: "mux.video"
    })
  ],
  preview: {
    select: {
      imageFilename: "image.asset.originalFilename",
      image: "image",
      videoAsset: "video.asset"
    },
    prepare({ imageFilename, image, videoAsset }) {
      return {
        title: imageFilename || (videoAsset ? "Video" : "Untitled"),
        media: image
      }
    }
  }
})
