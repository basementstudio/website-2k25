import { defineField, defineType } from "sanity"

export const client = defineType({
  name: "client",
  title: "Client",
  type: "document",
  preview: { select: { title: "title", media: "logo" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image"
    }),
    defineField({
      name: "website",
      title: "Website",
      type: "url"
    })
  ]
})
