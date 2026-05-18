import { defineArrayMember, defineField, defineType } from "sanity"

export const sceneConfig = defineType({
  name: "sceneConfig",
  title: "Scene",
  type: "document",
  fields: [
    defineField({
      name: "sceneName",
      title: "Scene Name",
      type: "string",
      description:
        "Stable identifier matching the route name in the 3D canvas (e.g. home, services, blog). Do not edit after creation.",
      validation: (r) => r.required(),
      readOnly: ({ document }) => Boolean(document?._createdAt)
    }),
    defineField({
      name: "cameraConfig",
      title: "Camera",
      type: "object",
      fields: [
        defineField({
          name: "posX",
          title: "Position X",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "posY",
          title: "Position Y",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "posZ",
          title: "Position Z",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "tarX",
          title: "Target X",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "tarY",
          title: "Target Y",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "tarZ",
          title: "Target Z",
          type: "number",
          initialValue: 0
        }),
        defineField({
          name: "fov",
          title: "Field of View",
          type: "number",
          initialValue: 60
        }),
        defineField({
          name: "targetScrollY",
          title: "Target Scroll Y",
          type: "number",
          initialValue: -1.5
        }),
        defineField({
          name: "offsetMultiplier",
          title: "Offset Multiplier",
          type: "number",
          initialValue: 1
        })
      ]
    }),
    defineField({
      name: "postprocessing",
      title: "Postprocessing",
      type: "object",
      description:
        "Visual feel tuning. Defaults (1.0) preserve the source unless overridden.",
      fields: [
        defineField({ name: "contrast", title: "Contrast", type: "number", initialValue: 1 }),
        defineField({ name: "brightness", title: "Brightness", type: "number", initialValue: 1 }),
        defineField({ name: "exposure", title: "Exposure", type: "number", initialValue: 1 }),
        defineField({ name: "gamma", title: "Gamma", type: "number", initialValue: 1 }),
        defineField({ name: "vignetteRadius", title: "Vignette Radius", type: "number", initialValue: 1 }),
        defineField({ name: "vignetteSpread", title: "Vignette Spread", type: "number", initialValue: 1 }),
        defineField({ name: "bloomStrength", title: "Bloom Strength", type: "number", initialValue: 1 }),
        defineField({ name: "bloomRadius", title: "Bloom Radius", type: "number", initialValue: 1 }),
        defineField({ name: "bloomThreshold", title: "Bloom Threshold", type: "number", initialValue: 1 })
      ]
    }),
    defineField({
      name: "tabs",
      title: "Navigation Tabs",
      type: "array",
      description: "Route tabs surfaced in this scene.",
      of: [
        defineArrayMember({
          type: "object",
          name: "tab",
          fields: [
            defineField({
              name: "tabName",
              title: "Display Name",
              type: "string",
              validation: (r) => r.required()
            }),
            defineField({
              name: "tabRoute",
              title: "Route",
              type: "string",
              description:
                "URL path (e.g. /services). Tied to app routing — coordinate any change with engineering.",
              validation: (r) => r.required()
            }),
            defineField({
              name: "tabHoverName",
              title: "Hover Name",
              type: "string"
            }),
            defineField({
              name: "tabClickableName",
              title: "Clickable Mesh Name",
              type: "string",
              description:
                "3D mesh name targeted by the click handler. Tied to the model — do not edit without engineering."
            }),
            defineField({
              name: "plusShapeScale",
              title: "Plus Shape Scale",
              type: "number",
              initialValue: 1
            })
          ],
          preview: {
            select: { title: "tabName", subtitle: "tabRoute" }
          }
        })
      ]
    })
  ],
  preview: {
    select: { title: "sceneName" }
  }
})
