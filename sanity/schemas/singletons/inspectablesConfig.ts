import { defineArrayMember, defineField, defineType } from "sanity"

export const inspectablesConfig = defineType({
  name: "inspectablesConfig",
  title: "Inspectables Config",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      type: "string",
      hidden: true,
      initialValue: "Inspectables Config"
    }),
    defineField({
      name: "inspectables",
      title: "Inspectables",
      type: "array",
      description:
        "One entry per inspectable. The inspectableId must match an entry in src/lib/3d-config/inspectables-meta.ts.",
      of: [
        defineArrayMember({
          type: "object",
          name: "inspectable",
          fields: [
            defineField({
              name: "inspectableId",
              title: "Inspectable ID",
              type: "string",
              description:
                "Stable join key. Lowercase / dashes / underscores. Do not edit after creation.",
              validation: (r) =>
                r
                  .required()
                  .regex(/^[a-zA-Z0-9_-]+$/, { name: "id-format" })
                  .error("ID must be alphanumeric, dashes or underscores only")
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
                  preview: { select: { title: "title", subtitle: "value" } }
                })
              ]
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "array",
              of: [defineArrayMember({ type: "block" })]
            })
          ],
          preview: {
            select: { title: "title", subtitle: "inspectableId" }
          }
        })
      ]
    })
  ]
})
