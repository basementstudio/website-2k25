import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'
import { convertRichText } from './utils/rich-text'
import { nanoid } from 'nanoid'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/**
 * Wrap a plain text string in a Sanity Portable Text block.
 * Used for fields that are plain strings in BaseHub but PT in Sanity.
 */
function plainTextToPortableText(text: string) {
  if (!text) return []
  return [
    {
      _type: 'block' as const,
      _key: nanoid(12),
      style: 'normal',
      children: [
        {
          _type: 'span' as const,
          _key: nanoid(12),
          text,
          marks: [] as string[],
        },
      ],
      markDefs: [],
    },
  ]
}

async function migrateHomepage() {
  console.log('  Fetching homepage data...')

  const data = await basehubClient.query({
    pages: {
      homepage: {
        intro: {
          title: { json: { content: true } },
          subtitle: { json: { content: true } },
        },
        capabilities: {
          _title: true,
          intro: { json: { content: true } },
        },
        featuredProjects: {
          projectList: {
            items: {
              _title: true,
              project: {
                _slug: true,
              },
            },
          },
        },
      },
    },
    company: {
      projects: {
        projectCategories: {
          items: {
            _title: true,
            _slug: true,
            description: true,
          },
        },
      },
    },
  })

  const homepage = data.pages.homepage

  // Convert intro rich text
  const introTitle = await convertRichText(
    homepage.intro?.title?.json?.content
  )
  const introSubtitle = await convertRichText(
    homepage.intro?.subtitle?.json?.content
  )

  // Build capabilities from project categories
  // (BaseHub capabilities is a section component; actual items come from project categories)
  const categories = data.company.projects.projectCategories.items || []
  const capabilities = (categories as Array<{ _title: string; _slug: string; description: string }>).map(
    (cat) => ({
      _key: nanoid(12),
      title: cat._title,
      ...(cat.description
        ? { description: plainTextToPortableText(cat.description) }
        : {}),
    })
  )

  // Featured project references
  const featuredProjects = (
    homepage.featuredProjects?.projectList?.items || []
  )
    .filter((item: { project?: { _slug?: string } }) => item.project?._slug)
    .map((item: { project: { _slug: string } }) => ({
      _key: nanoid(12),
      _type: 'reference' as const,
      _ref: `project-${item.project._slug}`,
    }))

  await sanityWriteClient.createOrReplace({
    _id: 'homepage',
    _type: 'homepage',
    ...(introTitle.length > 0 ? { introTitle } : {}),
    ...(introSubtitle.length > 0 ? { introSubtitle } : {}),
    ...(capabilities.length > 0 ? { capabilities } : {}),
    ...(featuredProjects.length > 0 ? { featuredProjects } : {}),
  })

  console.log('  Homepage singleton created')
}

async function migrateServicesPage() {
  console.log('  Fetching services page data...')

  const data = await basehubClient.query({
    pages: {
      services: {
        intro: { json: { content: true } },
        heroImage: {
          url: true,
          width: true,
          height: true,
          alt: true,
        },
        ventures: {
          title: true,
          content: { json: { content: true } },
          image: {
            url: true,
            width: true,
            height: true,
            alt: true,
          },
        },
      },
    },
    company: {
      services: {
        serviceCategories: {
          items: {
            _title: true,
            _slug: true,
            description: { json: { content: true } },
          },
        },
      },
    },
  })

  const services = data.pages.services

  // Convert intro rich text
  const intro = await convertRichText(services.intro?.json?.content)

  // Hero image
  const heroImage = await downloadAndUploadImage(
    services.heroImage?.url,
    'services-hero'
  )

  // Ventures — single section in BaseHub, stored as array item in Sanity
  const venturesContent = await convertRichText(
    services.ventures?.content?.json?.content
  )
  const venturesImage = await downloadAndUploadImage(
    services.ventures?.image?.url,
    'ventures-image'
  )
  const ventures = []
  if (services.ventures?.title || venturesContent.length > 0) {
    ventures.push({
      _key: nanoid(12),
      title: services.ventures?.title || '',
      ...(venturesContent.length > 0 ? { content: venturesContent } : {}),
      ...(venturesImage ? { image: venturesImage } : {}),
    })
  }

  // Service categories
  const serviceCategories = []
  const catItems = (data.company.services.serviceCategories.items || []) as Array<{
    _title: string
    _slug: string
    description?: { json?: { content?: unknown[] } }
  }>
  for (const cat of catItems) {
    const description = await convertRichText(
      cat.description?.json?.content as Parameters<typeof convertRichText>[0]
    )
    serviceCategories.push({
      _key: cat._slug || slugify(cat._title || 'cat'),
      title: cat._title,
      ...(description.length > 0 ? { description } : {}),
    })
  }

  await sanityWriteClient.createOrReplace({
    _id: 'servicesPage',
    _type: 'servicesPage',
    ...(intro.length > 0 ? { intro } : {}),
    ...(heroImage ? { heroImage } : {}),
    ...(ventures.length > 0 ? { ventures } : {}),
    ...(serviceCategories.length > 0 ? { serviceCategories } : {}),
  })

  console.log('  Services page singleton created')
}

async function migratePeoplePage() {
  console.log('  Fetching people page data...')

  const data = await basehubClient.query({
    pages: {
      people: {
        _title: true,
        subheading1: { json: { content: true } },
        subheading2: { json: { content: true } },
        preOpenPositions: {
          sideA: {
            url: true,
            alt: true,
          },
          sideB: {
            url: true,
            alt: true,
          },
          text: { json: { content: true } },
        },
      },
    },
  })

  const people = data.pages.people

  // Convert rich text
  const subheading1 = await convertRichText(
    people.subheading1?.json?.content
  )
  const subheading2 = await convertRichText(
    people.subheading2?.json?.content
  )
  const preOpenPositionsText = await convertRichText(
    people.preOpenPositions?.text?.json?.content
  )

  // Side images
  const sideImages = []
  const sideA = await downloadAndUploadImage(
    people.preOpenPositions?.sideA?.url,
    'people-side-a'
  )
  const sideB = await downloadAndUploadImage(
    people.preOpenPositions?.sideB?.url,
    'people-side-b'
  )
  if (sideA) sideImages.push({ ...sideA, _key: nanoid(12) })
  if (sideB) sideImages.push({ ...sideB, _key: nanoid(12) })

  await sanityWriteClient.createOrReplace({
    _id: 'peoplePage',
    _type: 'peoplePage',
    title: people._title || undefined,
    ...(subheading1.length > 0 ? { subheading1 } : {}),
    ...(subheading2.length > 0 ? { subheading2 } : {}),
    ...(sideImages.length > 0
      ? { preOpenPositionsSideImages: sideImages }
      : {}),
    ...(preOpenPositionsText.length > 0 ? { preOpenPositionsText } : {}),
  })

  console.log('  People page singleton created')
}

async function migrateCareersPostPage() {
  console.log('  Fetching careers post page data...')

  const data = await basehubClient.query({
    pages: {
      careersPost: {
        heroTitle: true,
      },
    },
  })

  await sanityWriteClient.createOrReplace({
    _id: 'careersPostPage',
    _type: 'careersPostPage',
    heroTitle: data.pages.careersPost?.heroTitle || undefined,
  })

  console.log('  Careers post page singleton created')
}

async function migrateCompanyInfo() {
  console.log('  Fetching company info...')

  const data = await basehubClient.query({
    company: {
      social: {
        github: true,
        instagram: true,
        twitter: true,
        linkedIn: true,
        newsletter: { json: { content: true } },
      },
    },
  })

  const social = data.company.social
  const newsletter = await convertRichText(
    social.newsletter?.json?.content
  )

  await sanityWriteClient.createOrReplace({
    _id: 'companyInfo',
    _type: 'companyInfo',
    github: social.github || undefined,
    instagram: social.instagram || undefined,
    twitter: social.twitter || undefined,
    linkedIn: social.linkedIn || undefined,
    ...(newsletter.length > 0 ? { newsletter } : {}),
  })

  console.log('  Company info singleton created')
}

export default async function migrateSingletons() {
  await migrateHomepage()
  await migrateServicesPage()
  await migratePeoplePage()
  await migrateCareersPostPage()
  await migrateCompanyInfo()
  console.log('  All singleton pages migrated')
}
