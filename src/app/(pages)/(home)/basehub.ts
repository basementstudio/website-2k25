import { client } from "@/service/basehub"
import { IMAGE_FRAGMENT, VIDEO_FRAGMENT } from "@/service/basehub/fragments"

interface OrganizationQueryResult {
  company: {
    structuredData: {
      description: string | null
      foundingDate: string | number | null
      email: string | null
      addressCity: string | null
      addressRegion: string | null
      addressCountry: string | null
      logo: { url: string } | null
      founders: {
        items: Array<{
          name: string | null
          url: string | null
          jobTitle: string | null
        }>
      }
    }
    awards: {
      awardList: {
        items: Array<{
          title?: string | null
          date?: string | number | null
          project?: { _title: string | null } | null
          projectFallback?: string | null
        }>
      }
    }
    social: {
      github: string | null
      instagram: string | null
      twitter: string | null
      linkedIn: string | null
    }
  }
}

export const mapOrganizationData = (data: OrganizationQueryResult) => {
  const structuredData = data.company.structuredData
  const awards = data.company.awards.awardList.items
  const social = data.company.social

  return {
    description: structuredData.description,
    foundingDate: structuredData.foundingDate,
    email: structuredData.email,
    addressCity: structuredData.addressCity,
    addressRegion: structuredData.addressRegion,
    addressCountry: structuredData.addressCountry,
    logo: structuredData.logo,
    founders: structuredData.founders.items
      .filter((f) => f.name !== null)
      .map((f) => ({
        name: f.name!,
        url: f.url,
        jobTitle: f.jobTitle
      })),
    awards: awards
      .filter(
        (
          award
        ): award is typeof award & {
          title: string
        } => typeof award.title === "string" && award.title.trim().length > 0
      )
      .map((award) => ({
        title: award.title,
        date: award.date,
        projectName: award.project?._title ?? award.projectFallback
      })),
    social: {
      github: social.github,
      instagram: social.instagram,
      twitter: social.twitter,
      linkedIn: social.linkedIn
    }
  }
}

export const fetchHomepage = async () => {
  const homepage = await client().query({
    pages: {
      homepage: {
        intro: {
          title: {
            json: {
              content: true
            }
          },
          subtitle: {
            json: {
              content: true
            }
          }
        },
        capabilities: {
          _title: true,
          intro: {
            json: {
              content: true
            }
          }
        },
        featuredProjects: {
          projectList: {
            items: {
              _title: true,
              excerpt: true,

              project: {
                _slug: true,
                cover: IMAGE_FRAGMENT,
                categories: {
                  _title: true
                },
                coverVideo: VIDEO_FRAGMENT
              },
              cover: IMAGE_FRAGMENT,
              coverVideo: VIDEO_FRAGMENT
            }
          }
        }
      }
    },
    company: {
      clients: {
        clientList: {
          items: {
            _id: true,
            _title: true,
            logo: true,
            website: true
          }
        }
      },
      projects: {
        projectCategories: {
          items: {
            _title: true,
            description: true,
            subCategories: {
              items: {
                _title: true
              }
            }
          }
        }
      }
    }
  })

  return homepage
}

export const fetchOrganizationData = async () => {
  const data: OrganizationQueryResult = await client().query({
    company: {
      structuredData: {
        description: true,
        foundingDate: true,
        email: true,
        addressCity: true,
        addressRegion: true,
        addressCountry: true,
        logo: { url: true },
        founders: {
          items: {
            name: true,
            url: true,
            jobTitle: true
          }
        }
      },
      awards: {
        awardList: {
          items: {
            title: true,
            date: true,
            project: {
              _title: true
            },
            projectFallback: true
          }
        }
      },
      social: {
        github: true,
        instagram: true,
        twitter: true,
        linkedIn: true
      }
    }
  })

  return mapOrganizationData(data)
}
