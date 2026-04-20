import { defineField, defineType } from "sanity"

export const showcasePage = defineType({
  name: "showcasePage",
  title: "Showcase Page",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      hidden: true,
      initialValue: "Showcase"
    }),
    defineField({
      name: "projects",
      title: "Projects",
      type: "array",
      of: [{ type: "reference", to: [{ type: "project" }] }]
    })
  ]
})
