import { defineField, defineType } from "sanity"

export const codeBlock = defineType({
  name: "codeBlock",
  title: "Code Block",
  type: "object",
  fields: [
    defineField({
      name: "files",
      title: "Files",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string"
            }),
            defineField({
              name: "code",
              title: "Code",
              type: "text"
            }),
            defineField({
              name: "language",
              title: "Language",
              type: "string"
            })
          ]
        }
      ]
    })
  ]
})
