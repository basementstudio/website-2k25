import { defineType, defineField } from 'sanity'

export const showcaseItem = defineType({
  name: 'showcaseItem',
  title: 'Showcase Item',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'object',
      fields: [
        defineField({
          name: 'url',
          title: 'URL',
          type: 'url',
        }),
        defineField({
          name: 'width',
          title: 'Width',
          type: 'number',
        }),
        defineField({
          name: 'height',
          title: 'Height',
          type: 'number',
        }),
        defineField({
          name: 'aspectRatio',
          title: 'Aspect Ratio',
          type: 'string',
        }),
        defineField({
          name: 'mimeType',
          title: 'MIME Type',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      imageFilename: 'image.asset.originalFilename',
      image: 'image',
      videoUrl: 'video.url',
    },
    prepare({ imageFilename, image, videoUrl }) {
      return {
        title: imageFilename || (videoUrl ? 'Video' : 'Untitled'),
        media: image,
      }
    },
  },
})
