import { defineField, defineType } from "sanity"

export const socialNetwork = defineType({
  name: "socialNetwork",
  title: "Social Network",
  type: "object",
  fields: [
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (rule) => rule.required()
    })
  ]
})
