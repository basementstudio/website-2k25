import { defineArrayMember, defineField, defineType } from "sanity"

export const scenesConfig = defineType({
  name: "scenesConfig",
  title: "Scenes Config",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      type: "string",
      hidden: true,
      initialValue: "Scenes Config"
    }),
    defineField({
      name: "scenes",
      title: "Scenes",
      type: "array",
      description: "One entry per scene the canvas renders.",
      of: [
        defineArrayMember({
          type: "object",
          name: "scene",
          fields: [
            defineField({
              name: "sceneName",
              title: "Scene Name",
              type: "string",
              description:
                "Stable identifier matching the route name (home, services, blog, etc.). Do not edit after creation.",
              validation: (r) => r.required()
            }),
            defineField({
              name: "cameraConfig",
              title: "Camera",
              type: "object",
              fields: [
                defineField({ name: "posX", title: "Position X", type: "number", initialValue: 0 }),
                defineField({ name: "posY", title: "Position Y", type: "number", initialValue: 0 }),
                defineField({ name: "posZ", title: "Position Z", type: "number", initialValue: 0 }),
                defineField({ name: "tarX", title: "Target X", type: "number", initialValue: 0 }),
                defineField({ name: "tarY", title: "Target Y", type: "number", initialValue: 0 }),
                defineField({ name: "tarZ", title: "Target Z", type: "number", initialValue: 0 }),
                defineField({ name: "fov", title: "Field of View", type: "number", initialValue: 60 }),
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
              description: "Visual feel tuning. Defaults (1.0) preserve the source.",
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
                      description: "URL path. Tied to app routing — coordinate any change with engineering.",
                      validation: (r) => r.required()
                    }),
                    defineField({ name: "tabHoverName", title: "Hover Name", type: "string" }),
                    defineField({
                      name: "tabClickableName",
                      title: "Clickable Mesh Name",
                      type: "string",
                      description: "3D mesh name. Tied to the model — do not edit without engineering."
                    }),
                    defineField({
                      name: "plusShapeScale",
                      title: "Plus Shape Scale",
                      type: "number",
                      initialValue: 1
                    })
                  ],
                  preview: { select: { title: "tabName", subtitle: "tabRoute" } }
                })
              ]
            })
          ],
          preview: {
            select: { title: "sceneName" }
          }
        })
      ]
    })
  ]
})
