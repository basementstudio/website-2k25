import { defineField, defineType } from "sanity"

export const tweetEmbed = defineType({
  name: "tweetEmbed",
  title: "Tweet Embed",
  type: "object",
  fields: [
    defineField({
      name: "tweetId",
      title: "Tweet ID",
      type: "string",
      validation: (rule) => rule.required()
    })
  ]
})
