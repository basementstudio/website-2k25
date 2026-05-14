import { defineField, defineType } from "sanity"

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  preview: { select: { title: "title", media: "heroImage" } },
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title" },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "date",
      title: "Date",
      type: "datetime",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "categories",
      title: "Categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "postCategory" }] }]
    }),
    defineField({
      name: "authors",
      title: "Authors",
      type: "array",
      of: [{ type: "reference", to: [{ type: "person" }] }]
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: { hotspot: true }
    }),
    defineField({
      name: "heroVideo",
      title: "Hero Video URL (legacy)",
      type: "url",
      deprecated: {
        reason:
          'Migrating to Mux. Use the "muxHeroVideo" field below for new uploads.'
      }
    }),
    defineField({
      name: "muxHeroVideo",
      title: "Hero Video (Mux)",
      type: "mux.video"
    }),
    defineField({
      name: "intro",
      title: "Intro",
      type: "array",
      of: [{ type: "block" }]
    }),
    defineField({
      name: "content",
      title: "Content",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string"
            })
          ]
        },
        { type: "codeBlock" },
        { type: "quoteWithAuthor" },
        { type: "codeSandbox" },
        { type: "sideNote" },
        { type: "gridGallery" },
        { type: "tweetEmbed" },
        { type: "videoEmbed" }
      ]
    })
  ]
})
