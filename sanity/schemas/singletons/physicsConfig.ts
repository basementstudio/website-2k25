import { defineArrayMember, defineField, defineType } from "sanity"

export const physicsConfig = defineType({
  name: "physicsConfig",
  title: "Physics Config",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      type: "string",
      hidden: true,
      initialValue: "Physics Config"
    }),
    defineField({
      name: "physicsParams",
      title: "Physics Parameters",
      type: "array",
      description:
        "Tunable physics values used by the basketball scene and elsewhere. Each entry is a labelled number.",
      of: [
        defineArrayMember({
          type: "object",
          name: "physicsParam",
          fields: [
            defineField({
              name: "title",
              title: "Label",
              type: "string",
              validation: (r) => r.required()
            }),
            defineField({
              name: "value",
              title: "Value",
              type: "number",
              validation: (r) => r.required()
            })
          ],
          preview: {
            select: { title: "title", subtitle: "value" }
          }
        })
      ]
    })
  ]
})
