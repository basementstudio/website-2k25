import { defineArrayMember, defineField, defineType } from "sanity"

// The model fields here are the ONLY source for the map geometry — the local
// GLBs were removed from public/3d/, so there is no fallback. Every model field
// is required: clearing one blocks publishing, and if one is somehow empty at
// runtime `fetchAssetsLocal` throws and every route under (site) fails.
// Map textures are still overrides (empty = the committed file in public/3d/).

const NO_FALLBACK =
  "Required — there is no local copy of this model. Clearing it takes the site down."

const MESH_WARNING =
  "Only swap this if the new export keeps the exact same mesh names — lightmap bakes, matcaps, inspectables and clickable tabs are all wired to them by name. Coordinate with engineering."

const KTX2_NOTE =
  "Uploads are loaded as-is: a raw Blender export works but will be heavier than a KTX2-compressed build."

function modelField(name: string, title: string, description: string) {
  return defineField({
    name,
    title,
    type: "file",
    description: `${NO_FALLBACK} ${description}`,
    options: { accept: ".glb,.gltf" },
    validation: (r) => r.required()
  })
}

export const mapAssetsConfig = defineType({
  name: "mapAssetsConfig",
  title: "Map Assets Config",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      type: "string",
      hidden: true,
      initialValue: "Map Assets Config"
    }),

    // --- Map models ---
    modelField(
      "office",
      "Office",
      `The main office shell — walls, floor, static geometry. ${MESH_WARNING} ${KTX2_NOTE}`
    ),
    modelField(
      "officeItems",
      "Office Items",
      `Props and inspectable objects inside the office. ${MESH_WARNING}`
    ),
    modelField(
      "officeWireframe",
      "Office Wireframe",
      "Wireframe pass of the office, used by the 404 / not-found material."
    ),
    modelField(
      "outdoor",
      "Outdoor",
      `Everything visible outside the windows. ${MESH_WARNING}`
    ),
    modelField(
      "outdoorCars",
      "Outdoor Cars",
      "Animated cars driving past outside."
    ),
    modelField("godrays", "Godrays", "Light-shaft geometry for the windows."),
    modelField(
      "routingElements",
      "Routing Elements",
      `Invisible click targets that drive canvas navigation. ${MESH_WARNING}`
    ),
    modelField(
      "basketball",
      "Basketball",
      "The ball used by the basketball mini-game."
    ),
    modelField(
      "basketballNet",
      "Basketball Net",
      "Hoop net — simulated, so vertex order matters."
    ),
    modelField(
      "contactPhone",
      "Contact Phone",
      "Phone model shown in the contact scene."
    ),

    // --- Map textures ---
    defineField({
      name: "mapTextures",
      title: "Map Textures",
      type: "object",
      description: "Standalone textures the map samples directly.",
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: "rain",
          title: "Rain",
          type: "file",
          description: "Rain sprite sheet (JPG).",
          options: { accept: ".jpg,.jpeg,.png,.webp" }
        }),
        defineField({
          name: "basketballVa",
          title: "Basketball VA",
          type: "file",
          description: "Basketball vertex-animation texture (EXR).",
          options: { accept: ".exr" }
        })
      ]
    }),

    // --- Mesh position overrides ---
    defineField({
      name: "meshOverrides",
      title: "Mesh Position Overrides",
      type: "array",
      description:
        "Written by the Editor tool: move an object with the gizmo, hit Save, and it lands here. " +
        "The site applies each entry to every object with that name after the GLBs load, so an " +
        "override survives a model re-upload as long as the mesh keeps its name. " +
        "Coordinates are world-space, in the GLB's units. " +
        "Delete an entry to put that object back where the model exports it.",
      of: [
        defineArrayMember({
          name: "meshOverride",
          title: "Mesh Override",
          type: "object",
          fields: [
            defineField({
              name: "mesh",
              title: "Mesh name",
              type: "string",
              validation: (r) => r.required()
            }),
            defineField({
              name: "x",
              type: "number",
              validation: (r) => r.required()
            }),
            defineField({
              name: "y",
              type: "number",
              validation: (r) => r.required()
            }),
            defineField({
              name: "z",
              type: "number",
              validation: (r) => r.required()
            })
          ],
          preview: {
            select: { mesh: "mesh", x: "x", y: "y", z: "z" },
            prepare: ({ mesh, x, y, z }) => ({
              title: mesh || "(unnamed mesh)",
              subtitle: [x, y, z]
                .map((n: number | undefined) =>
                  typeof n === "number" ? n.toFixed(3) : "?"
                )
                .join(", ")
            })
          }
        })
      ]
    })
  ]
})
