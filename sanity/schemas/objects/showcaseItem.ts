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
      type: 'file',
      options: { accept: 'video/mp4,video/webm' },
    }),
  ],
  preview: {
    select: {
      imageFilename: 'image.asset.originalFilename',
      image: 'image',
      videoAsset: 'video.asset',
    },
    prepare({ imageFilename, image, videoAsset }) {
      return {
        title: imageFilename || (videoAsset ? 'Video' : 'Untitled'),
        media: image,
      }
    },
  },
})
