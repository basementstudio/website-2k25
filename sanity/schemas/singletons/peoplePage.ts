import { defineType, defineField } from 'sanity'

export const peoplePage = defineType({
  name: 'peoplePage',
  title: 'People Page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'subheading1',
      title: 'Subheading 1',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'subheading2',
      title: 'Subheading 2',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'preOpenPositionsSideImages',
      title: 'Pre Open Positions Side Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'preOpenPositionsText',
      title: 'Pre Open Positions Text',
      type: 'array',
      of: [{ type: 'block' }],
    }),
  ],
})
