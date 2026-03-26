import { defineType, defineField } from 'sanity'

export const careersPostPage = defineType({
  name: 'careersPostPage',
  title: 'Careers Post Page',
  type: 'document',
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
    }),
  ],
})
