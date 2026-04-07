export const getCareerMetadataQuery = (slug: string) => ({
  company: {
    openPositions: {
      openPositionsList: {
        __args: {
          first: 1,
          filter: {
            _sys_slug: {
              eq: slug
            }
          }
        },
        items: {
          _title: true
        }
      }
    }
  }
})
