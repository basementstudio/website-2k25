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
            firstAndLastName: true,
            email: true,
            location: true,
            whyDoYouWantToJoin: true,
            applyingToPosition: true,
            designSkills: true,
            yearsOfExperience: true,
            portfolio: true,
            availability: true,
            linkedin: true,
            salaryExpectation: true
          }
        }
      }
    }
  }
})

export type CareerPostQueryType = fragmentOn.infer<typeof careerPostQuery>

export type OpenPositionItem =
  CareerPostQueryType["company"]["openPositions"]["openPositionsList"]["items"][number]
