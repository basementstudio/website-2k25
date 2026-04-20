import { defineField, defineType } from "sanity"

export const department = defineType({
  name: "department",
  title: "Department",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required()
    })
  ]
})
