import { defineType, defineField } from 'sanity'

export const threeDAssets = defineType({
  name: 'threeDAssets',
  title: '3D Assets',
  type: 'document',
  preview: { select: { title: 'title' } },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      hidden: true,
      initialValue: '3D Assets',
    }),
    // --- Map models ---
    defineField({
      name: 'officeItems',
      title: 'Office Items',
      type: 'file',
    }),
    defineField({
      name: 'office',
      title: 'Office',
      type: 'file',
    }),
    defineField({
      name: 'officeWireframe',
      title: 'Office Wireframe',
      type: 'file',
    }),
    defineField({
      name: 'outdoor',
      title: 'Outdoor',
      type: 'file',
    }),
    defineField({
      name: 'godrays',
      title: 'Godrays',
      type: 'file',
    }),
    defineField({
      name: 'basketball',
      title: 'Basketball',
      type: 'file',
    }),
    defineField({
      name: 'basketballNet',
      title: 'Basketball Net',
      type: 'file',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'file',
    }),
    defineField({
      name: 'routingElements',
      title: 'Routing Elements',
      type: 'file',
    }),
    defineField({
      name: 'outdoorCars',
      title: 'Outdoor Cars',
      type: 'file',
    }),

    // --- Special Events ---
    defineField({
      name: 'specialEvents',
      title: 'Special Events',
      type: 'object',
      fields: [
        defineField({
          name: 'christmas',
          title: 'Christmas',
          type: 'object',
          fields: [
            defineField({
              name: 'tree',
              title: 'Tree',
              type: 'file',
            }),
            defineField({
              name: 'song',
              title: 'Song',
              type: 'file',
            }),
          ],
        }),
      ],
    }),

    // --- Bakes ---
    defineField({
      name: 'bakes',
      title: 'Bakes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'lightmap',
              title: 'Lightmap',
              type: 'file',
            }),
            defineField({
              name: 'ambientOcclusion',
              title: 'Ambient Occlusion',
              type: 'file',
            }),
            defineField({
              name: 'meshes',
              title: 'Meshes',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
        },
      ],
    }),

    // --- Matcaps ---
    defineField({
      name: 'matcaps',
      title: 'Matcaps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'mesh',
              title: 'Mesh',
              type: 'string',
            }),
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
            }),
            defineField({
              name: 'isGlass',
              title: 'Is Glass',
              type: 'boolean',
            }),
          ],
        },
      ],
    }),

    // --- Glass Materials (string names) ---
    defineField({
      name: 'glassMaterials',
      title: 'Glass Materials',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Double Side Elements (string names) ---
    defineField({
      name: 'doubleSideElements',
      title: 'Double Side Elements',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // --- Glass Reflexes ---
    defineField({
      name: 'glassReflexes',
      title: 'Glass Reflexes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'mesh',
              title: 'Mesh',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'file',
            }),
          ],
        },
      ],
    }),

    // --- Arcade ---
    defineField({
      name: 'arcade',
      title: 'Arcade',
      type: 'object',
      fields: [
        defineField({
          name: 'idleScreen',
          title: 'Idle Screen',
          type: 'file',
        }),
        defineField({
          name: 'placeholderLab',
          title: 'Placeholder Lab',
          type: 'file',
        }),
        defineField({
          name: 'boot',
          title: 'Boot',
          type: 'file',
        }),
        defineField({
          name: 'chronicles',
          title: 'Chronicles',
          type: 'file',
        }),
        defineField({
          name: 'looper',
          title: 'Looper',
          type: 'file',
        }),
        defineField({
          name: 'palm',
          title: 'Palm',
          type: 'file',
        }),
        defineField({
          name: 'skybox',
          title: 'Skybox',
          type: 'file',
        }),
        defineField({
          name: 'cityscape',
          title: 'Cityscape',
          type: 'file',
        }),
        defineField({
          name: 'introScreen',
          title: 'Intro Screen',
          type: 'file',
        }),
      ],
    }),

    // --- Videos ---
    defineField({
      name: 'videos',
      title: 'Videos',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'mesh',
              title: 'Mesh',
              type: 'string',
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'file',
            }),
            defineField({
              name: 'intensity',
              title: 'Intensity',
              type: 'number',
            }),
          ],
        },
      ],
    }),

    // --- Inspectables ---
    defineField({
      name: 'inspectables',
      title: 'Inspectables',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'inspectableId',
              title: 'ID',
              type: 'string',
            }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'specs',
              title: 'Specs',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'specId',
                      title: 'ID',
                      type: 'string',
                    }),
                    defineField({
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                    }),
                    defineField({
                      name: 'value',
                      title: 'Value',
                      type: 'string',
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'array',
              of: [{ type: 'block' }],
            }),
            defineField({
              name: 'mesh',
              title: 'Mesh',
              type: 'string',
            }),
            defineField({
              name: 'xOffset',
              title: 'X Offset',
              type: 'number',
            }),
            defineField({
              name: 'yOffset',
              title: 'Y Offset',
              type: 'number',
            }),
            defineField({
              name: 'xRotationOffset',
              title: 'X Rotation Offset',
              type: 'number',
            }),
            defineField({
              name: 'sizeTarget',
              title: 'Size Target',
              type: 'number',
            }),
            defineField({
              name: 'scenes',
              title: 'Scenes',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'fx',
              title: 'FX',
              type: 'file',
            }),
          ],
        },
      ],
    }),

    // --- SFX ---
    defineField({
      name: 'sfx',
      title: 'SFX',
      type: 'object',
      fields: [
        defineField({
          name: 'basketballTheme',
          title: 'Basketball Theme',
          type: 'file',
        }),
        defineField({
          name: 'basketballSwoosh',
          title: 'Basketball Swoosh',
          type: 'file',
        }),
        defineField({
          name: 'basketballNet',
          title: 'Basketball Net',
          type: 'file',
        }),
        defineField({
          name: 'basketballThump',
          title: 'Basketball Thump',
          type: 'file',
        }),
        defineField({
          name: 'basketballBuzzer',
          title: 'Basketball Buzzer',
          type: 'file',
        }),
        defineField({
          name: 'basketballStreak',
          title: 'Basketball Streak',
          type: 'file',
        }),
        defineField({
          name: 'knobTurning',
          title: 'Knob Turning',
          type: 'file',
        }),
        defineField({
          name: 'antenna',
          title: 'Antenna',
          type: 'file',
        }),
        defineField({
          name: 'blog',
          title: 'Blog',
          type: 'object',
          fields: [
            defineField({
              name: 'lockedDoor',
              title: 'Locked Door',
              type: 'array',
              of: [{ type: 'file' }],
            }),
            defineField({
              name: 'door',
              title: 'Door',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      title: 'open.asset->originalFilename',
                    },
                  },
                  fields: [
                    defineField({
                      name: 'open',
                      title: 'Open',
                      type: 'file',
                    }),
                    defineField({
                      name: 'close',
                      title: 'Close',
                      type: 'file',
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: 'lamp',
              title: 'Lamp',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      title: 'pull.asset->originalFilename',
                    },
                  },
                  fields: [
                    defineField({
                      name: 'pull',
                      title: 'Pull',
                      type: 'file',
                    }),
                    defineField({
                      name: 'release',
                      title: 'Release',
                      type: 'file',
                    }),
                  ],
                },
              ],
            }),
          ],
        }),
        defineField({
          name: 'arcade',
          title: 'Arcade',
          type: 'object',
          fields: [
            defineField({
              name: 'buttons',
              title: 'Buttons',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      title: 'press.asset->originalFilename',
                    },
                  },
                  fields: [
                    defineField({
                      name: 'press',
                      title: 'Press',
                      type: 'file',
                    }),
                    defineField({
                      name: 'release',
                      title: 'Release',
                      type: 'file',
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: 'sticks',
              title: 'Sticks',
              type: 'array',
              of: [
                {
                  type: 'object',
                  preview: {
                    select: {
                      title: 'press.asset->originalFilename',
                    },
                  },
                  fields: [
                    defineField({
                      name: 'press',
                      title: 'Press',
                      type: 'file',
                    }),
                    defineField({
                      name: 'release',
                      title: 'Release',
                      type: 'file',
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: 'miamiHeatwave',
              title: 'Miami Heatwave',
              type: 'file',
            }),
          ],
        }),
        defineField({
          name: 'music',
          title: 'Music',
          type: 'object',
          fields: [
            defineField({
              name: 'aqua',
              title: 'Aqua',
              type: 'file',
            }),
            defineField({
              name: 'rain',
              title: 'Rain',
              type: 'file',
            }),
            defineField({
              name: 'tiger',
              title: 'Tiger',
              type: 'file',
            }),
            defineField({
              name: 'vhs',
              title: 'VHS',
              type: 'file',
            }),
          ],
        }),
        defineField({
          name: 'contact',
          title: 'Contact',
          type: 'object',
          fields: [
            defineField({
              name: 'interference',
              title: 'Interference',
              type: 'file',
            }),
          ],
        }),
      ],
    }),

    // --- Scenes ---
    defineField({
      name: 'scenes',
      title: 'Scenes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
            }),
            defineField({
              name: 'cameraConfig',
              title: 'Camera Config',
              type: 'object',
              fields: [
                defineField({
                  name: 'posX',
                  title: 'Position X',
                  type: 'number',
                }),
                defineField({
                  name: 'posY',
                  title: 'Position Y',
                  type: 'number',
                }),
                defineField({
                  name: 'posZ',
                  title: 'Position Z',
                  type: 'number',
                }),
                defineField({
                  name: 'tarX',
                  title: 'Target X',
                  type: 'number',
                }),
                defineField({
                  name: 'tarY',
                  title: 'Target Y',
                  type: 'number',
                }),
                defineField({
                  name: 'tarZ',
                  title: 'Target Z',
                  type: 'number',
                }),
                defineField({
                  name: 'fov',
                  title: 'FOV',
                  type: 'number',
                }),
                defineField({
                  name: 'targetScrollY',
                  title: 'Target Scroll Y',
                  type: 'number',
                }),
                defineField({
                  name: 'offsetMultiplier',
                  title: 'Offset Multiplier',
                  type: 'number',
                }),
              ],
            }),
            defineField({
              name: 'tabs',
              title: 'Tabs',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'tabName',
                      title: 'Tab Name',
                      type: 'string',
                    }),
                    defineField({
                      name: 'tabRoute',
                      title: 'Tab Route',
                      type: 'string',
                    }),
                    defineField({
                      name: 'tabHoverName',
                      title: 'Tab Hover Name',
                      type: 'string',
                    }),
                    defineField({
                      name: 'tabClickableName',
                      title: 'Tab Clickable Name',
                      type: 'string',
                    }),
                    defineField({
                      name: 'plusShapeScale',
                      title: 'Plus Shape Scale',
                      type: 'number',
                    }),
                  ],
                },
              ],
            }),
            defineField({
              name: 'postprocessing',
              title: 'Postprocessing',
              type: 'object',
              fields: [
                defineField({
                  name: 'contrast',
                  title: 'Contrast',
                  type: 'number',
                }),
                defineField({
                  name: 'brightness',
                  title: 'Brightness',
                  type: 'number',
                }),
                defineField({
                  name: 'exposure',
                  title: 'Exposure',
                  type: 'number',
                }),
                defineField({
                  name: 'gamma',
                  title: 'Gamma',
                  type: 'number',
                }),
                defineField({
                  name: 'vignetteRadius',
                  title: 'Vignette Radius',
                  type: 'number',
                }),
                defineField({
                  name: 'vignetteSpread',
                  title: 'Vignette Spread',
                  type: 'number',
                }),
                defineField({
                  name: 'bloomStrength',
                  title: 'Bloom Strength',
                  type: 'number',
                }),
                defineField({
                  name: 'bloomRadius',
                  title: 'Bloom Radius',
                  type: 'number',
                }),
                defineField({
                  name: 'bloomThreshold',
                  title: 'Bloom Threshold',
                  type: 'number',
                }),
              ],
            }),
          ],
        },
      ],
    }),

    // --- Characters ---
    defineField({
      name: 'characters',
      title: 'Characters',
      type: 'object',
      fields: [
        defineField({
          name: 'model',
          title: 'Model',
          type: 'file',
        }),
        defineField({
          name: 'textureBody',
          title: 'Texture Body',
          type: 'file',
        }),
        defineField({
          name: 'textureFaces',
          title: 'Texture Faces',
          type: 'file',
        }),
        defineField({
          name: 'textureArms',
          title: 'Texture Arms',
          type: 'file',
        }),
        defineField({
          name: 'textureComic',
          title: 'Texture Comic',
          type: 'file',
        }),
      ],
    }),

    // --- Pets ---
    defineField({
      name: 'pets',
      title: 'Pets',
      type: 'object',
      fields: [
        defineField({
          name: 'model',
          title: 'Model',
          type: 'file',
        }),
        defineField({
          name: 'pureTexture',
          title: 'Pure Texture',
          type: 'file',
        }),
        defineField({
          name: 'bostonTexture',
          title: 'Boston Texture',
          type: 'file',
        }),
      ],
    }),

    // --- Lamp ---
    defineField({
      name: 'lamp',
      title: 'Lamp',
      type: 'object',
      fields: [
        defineField({
          name: 'extraLightmap',
          title: 'Extra Lightmap',
          type: 'file',
        }),
      ],
    }),

    // --- Map Textures ---
    defineField({
      name: 'mapTextures',
      title: 'Map Textures',
      type: 'object',
      fields: [
        defineField({
          name: 'rain',
          title: 'Rain',
          type: 'file',
        }),
        defineField({
          name: 'basketballVa',
          title: 'Basketball VA',
          type: 'file',
        }),
      ],
    }),

    // --- Physics Params ---
    defineField({
      name: 'physicsParams',
      title: 'Physics Params',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'number',
            }),
          ],
        },
      ],
    }),
  ],
})
