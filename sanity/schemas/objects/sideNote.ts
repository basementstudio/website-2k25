import { defineType, defineField } from 'sanity'

export const sideNote = defineType({
  name: 'sideNote',
  title: 'Side Note',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
})
