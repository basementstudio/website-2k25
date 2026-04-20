import { defineField, defineType } from "sanity"

export const codeSandbox = defineType({
  name: "codeSandbox",
  title: "CodeSandbox",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string"
    }),
    defineField({
      name: "sandboxKey",
      title: "Sandbox Key",
      type: "string",
      validation: (rule) => rule.required()
    })
  ]
})
