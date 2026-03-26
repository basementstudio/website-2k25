import { defineField, defineType } from 'sanity'

export const labProject = defineType({
  name: 'labProject',
  title: 'Lab Project',
  type: 'document',
  preview: { select: { title: 'title', media: 'cover' } },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'cover',
      title: 'Cover',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
})
