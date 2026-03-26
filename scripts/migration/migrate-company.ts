import { basehubClient } from './basehub-client'
import { sanityWriteClient } from './sanity-client'
import { downloadAndUploadImage } from './utils/images'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function migrateDepartments() {
  console.log('  Fetching people to extract departments...')

  const data = await basehubClient.query({
    company: {
      people: {
        peopleList: {
          items: {
            _id: true,
            department: {
              _title: true,
            },
          },
        },
      },
    },
  })

  const people = data.company.people.peopleList.items
  const departmentNames = new Set<string>()

  for (const person of people) {
    const dept = person.department?._title
    if (dept) departmentNames.add(dept)
  }

  console.log(`  Found ${departmentNames.size} unique departments`)

  let count = 0
  for (const name of departmentNames) {
    const slug = slugify(name)
    await sanityWriteClient.createOrReplace({
      _id: `department-${slug}`,
      _type: 'department',
      title: name,
    })
    count++
  }

  console.log(`  Created ${count} department documents`)
  return count
}

async function migrateClients() {
  console.log('  Fetching clients...')

  const data = await basehubClient.query({
    company: {
      clients: {
        clientList: {
          items: {
            _id: true,
            _title: true,
            _slug: true,
            logo: {
              url: true,
              alt: true,
            },
            website: true,
          },
        },
      },
    },
  })

  const clients = data.company.clients.clientList.items
  console.log(`  Found ${clients.length} clients`)

  let count = 0
  for (const client of clients) {
    const slug = client._slug || slugify(client._title)
    // Download and upload logo if available
    let logo = undefined
    if (client.logo?.url) {
      const logoRef = await downloadAndUploadImage(
        client.logo.url,
        `${slug}-logo`
      )
      if (logoRef) logo = logoRef
    }

    await sanityWriteClient.createOrReplace({
      _id: `client-${slug}`,
      _type: 'client',
      title: client._title,
      website: client.website || undefined,
      ...(logo ? { logo } : {}),
    })
    count++
  }

  console.log(`  Created ${count} client documents`)
  return count
}

export default async function migrateCompany() {
  const deptCount = await migrateDepartments()
  const clientCount = await migrateClients()
  console.log(
    `  Summary: ${deptCount} departments, ${clientCount} clients migrated`
  )
}
