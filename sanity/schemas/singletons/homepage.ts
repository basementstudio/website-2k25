import { defineField, defineType } from "sanity"

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  preview: { select: { title: "title" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      hidden: true,
      initialValue: "Homepage"
    }),
    defineField({
      name: "introTitle",
      title: "Intro Title",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "introSubtitle",
      title: "Intro Subtitle",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "clients",
      title: "Clients",
      description: "Select and order clients to display in the brands section",
      type: "array",
      of: [{ type: "reference", to: [{ type: "client" }] }]
    }),
    defineField({
      name: "featuredProjects",
      title: "Featured Projects",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Title",
              type: "string"
            }),
            defineField({
              name: "excerpt",
              title: "Excerpt",
              type: "string"
            }),
            defineField({
              name: "project",
              title: "Project",
              type: "reference",
              to: [{ type: "project" }]
            }),
            defineField({
              name: "cover",
              title: "Cover",
              type: "image",
              options: { hotspot: true }
            }),
            defineField({
              name: "coverVideo",
              title: "Cover Video",
              type: "file",
              options: { accept: "video/mp4,video/webm" }
            })
          ],
          preview: {
            select: {
              title: "title",
              subtitle: "project.title",
              media: "cover"
            }
          }
        }
      ]
    }),
    defineField({
      name: "capabilitiesIntro",
      title: "Capabilities Intro",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "capabilities",
      title: "Capabilities",
      description:
        "Select and order project categories to display in the capabilities section",
      type: "array",
      of: [{ type: "reference", to: [{ type: "projectCategory" }] }]
    })
  ]
})
