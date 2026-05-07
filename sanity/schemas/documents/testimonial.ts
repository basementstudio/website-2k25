import { defineField, defineType } from "sanity"

export const testimonial = defineType({
  name: "testimonial",
  title: "Testimonial",
  type: "document",
  preview: { select: { title: "name" } },
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "handle",
      title: "Handle",
      type: "string"
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "text"
    }),
    defineField({
      name: "avatar",
      title: "Avatar",
      type: "image",
      options: { hotspot: true }
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime"
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "array",
      of: [
        {
          type: "block",
          styles: [{ title: "Normal", value: "normal" }],
          lists: [],
          marks: {
            decorators: [],
            annotations: [
              {
                name: "link",
                type: "object",
                title: "Link",
                fields: [
                  {
                    name: "href",
                    type: "url",
                    title: "URL",
                    validation: (rule) =>
                      rule
                        .uri({
                          scheme: ["http", "https", "mailto", "tel"],
                          allowRelative: true
                        })
                        .required()
                  },
                  {
                    name: "blank",
                    type: "boolean",
                    title: "Open in new tab",
                    initialValue: true
                  }
                ]
              }
            ]
          }
        }
      ],
      validation: (rule) => rule.max(1)
    })
  ]
})
