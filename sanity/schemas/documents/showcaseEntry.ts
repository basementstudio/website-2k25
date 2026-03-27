import { defineType, defineField } from 'sanity'

export const showcaseEntry = defineType({
  name: 'showcaseEntry',
  title: 'Showcase Entry',
  type: 'document',
  preview: { select: { title: 'project.title' } },
  fields: [
    defineField({
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{ type: 'project' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Order Rank',
      type: 'string',
    }),
  ],
})
