import { defineField, defineType } from "sanity"

export const gridGallery = defineType({
  name: "gridGallery",
  title: "Grid Gallery",
  type: "object",
  fields: [
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }]
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "string"
    })
  ]
})
