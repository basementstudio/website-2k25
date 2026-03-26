import { defineType, defineField } from 'sanity'

export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'Video File',
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
  preview: {
    select: { caption: 'caption' },
    prepare({ caption }) {
      return { title: caption || 'Video' }
    },
  },
})
