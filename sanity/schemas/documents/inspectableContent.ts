import { defineArrayMember, defineField, defineType } from "sanity"

export const inspectableContent = defineType({
  name: "inspectableContent",
  title: "Inspectable",
  type: "document",
  fields: [
    defineField({
      name: "inspectableId",
      title: "Inspectable ID",
      type: "string",
      description:
        "Stable identifier matching the 3D config in src/lib/3d-config. Lowercase, no spaces. Do not edit after creation.",
      validation: (r) =>
        r
          .required()
          .regex(/^[a-zA-Z0-9_-]+$/, {
            name: "id-format",
            invert: false
          })
          .error("ID must be alphanumeric, dashes or underscores only"),
      readOnly: ({ document }) => Boolean(document?._createdAt)
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (r) => r.required()
    }),
    defineField({
      name: "specs",
      title: "Specs",
      type: "array",
      description: "Key/value pairs displayed in the inspectable detail panel.",
      of: [
        defineArrayMember({
          type: "object",
          name: "spec",
          fields: [
            defineField({
              name: "specId",
              title: "Spec ID",
              type: "string",
              validation: (r) => r.required()
            }),
            defineField({
              name: "title",
              title: "Label",
              type: "string",
              validation: (r) => r.required()
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "string",
              validation: (r) => r.required()
            })
          ],
          preview: {
            select: { title: "title", subtitle: "value" }
          }
        })
      ]
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      description: "Rich-text description rendered in the inspectable detail panel.",
      of: [defineArrayMember({ type: "block" })]
    })
  ],
  preview: {
    select: { title: "title", subtitle: "inspectableId" }
  }
})
