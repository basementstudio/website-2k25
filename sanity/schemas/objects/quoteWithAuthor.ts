import { defineType, defineField } from 'sanity'

export const quoteWithAuthor = defineType({
  name: 'quoteWithAuthor',
  title: 'Quote with Author',
  type: 'object',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: { hotspot: true },
    }),
  ],
})
