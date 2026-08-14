import { defineArrayMember, defineField, defineType } from "sanity"

export const faqPage = defineType({
  name: "faqPage",
  title: "FAQ Page",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      hidden: true,
      initialValue: "FAQ"
    }),
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string"
    }),
    defineField({
      name: "metaDescription",
      title: "Meta Description",
      type: "text",
      rows: 3
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string"
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "text",
      rows: 3
    }),
    defineField({
      name: "entries",
      title: "Entries",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "string",
              validation: (rule) => rule.required()
            }),
            // Plain text, not Portable Text: the same string is rendered as
            // HTML, FAQPage JSON-LD and markdown — markup would leak into two
            // of the three.
            defineField({
              name: "answer",
              title: "Answer",
              type: "text",
              rows: 5,
              validation: (rule) => rule.required()
            })
          ],
          preview: { select: { title: "question", subtitle: "answer" } }
        })
      ]
    })
  ]
})
