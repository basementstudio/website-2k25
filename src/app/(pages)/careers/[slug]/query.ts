import { fragmentOn } from "basehub"

export const careerPostQuery = fragmentOn("Query", {
  pages: {
    careersPost: {
      heroTitle: true
    }
  },
  company: {
    openPositions: {
      openPositionsList: {
        items: {
          _title: true,
          _slug: true,
          _id: true,
          _sys: { createdAt: true },
          type: true,
          employmentType: true,
          location: true,
          isOpen: true,
          applyUrl: true,
          jobDescription: {
            json: {
              content: true
            }
          },
          applyFormSetup: {
            formFields: true,
            skills: {
              items: {
                _title: true,
                _slug: true
              }
            }
          }
        }
      }
    }
  }
})

export type CareerPostQueryType = fragmentOn.infer<typeof careerPostQuery>

export type OpenPositionItem =
  CareerPostQueryType["company"]["openPositions"]["openPositionsList"]["items"][number]
