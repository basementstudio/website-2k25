import { defineField, defineType } from "sanity"

export const award = defineType({
  name: "award",
  title: "Award",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime"
    }),
    defineField({
      name: "awardUrl",
      title: "Award URL",
      type: "url"
    }),
    defineField({
      name: "project",
      title: "Project",
      type: "reference",
      to: [{ type: "project" }]
    }),
    defineField({
      name: "certificate",
      title: "Certificate",
      type: "image"
    })
  ]
})
