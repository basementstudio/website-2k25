import { defineField, defineType } from "sanity"

export const companyInfo = defineType({
  name: "companyInfo",
  title: "Company Info",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      hidden: true,
      initialValue: "Company Info"
    }),
    defineField({
      name: "github",
      title: "GitHub",
      type: "url"
    }),
    defineField({
      name: "instagram",
      title: "Instagram",
      type: "url"
    }),
    defineField({
      name: "twitter",
      title: "Twitter",
      type: "url"
    }),
    defineField({
      name: "linkedIn",
      title: "LinkedIn",
      type: "url"
    }),
    defineField({
      name: "newsletter",
      title: "Newsletter",
      type: "array",
      of: [{ type: "block" }]
    })
  ]
})
