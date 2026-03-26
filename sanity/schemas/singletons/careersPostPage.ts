import { defineType, defineField } from 'sanity'

export const careersPostPage = defineType({
  name: 'careersPostPage',
  title: 'Careers Post Page',
  type: 'document',
  preview: { select: { title: 'title' } },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true,
      initialValue: 'Careers',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
    }),
  ],
})
