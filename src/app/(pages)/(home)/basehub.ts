import { basehub } from "basehub"

import { IMAGE_FRAGMENT, VIDEO_FRAGMENT } from "@/service/basehub/fragments"

export const fetchHomepage = async () => {
  const homepage = await basehub().query({
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
