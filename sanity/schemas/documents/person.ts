import { defineType, defineField } from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  preview: { select: { title: 'title' } },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'department',
      title: 'Department',
      type: 'reference',
      to: [{ type: 'department' }],
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'socialNetworks',
      title: 'Social Networks',
      type: 'array',
      of: [{ type: 'socialNetwork' }],
    }),
  ],
})
