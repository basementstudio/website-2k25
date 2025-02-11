"use server"

import { basehub } from "basehub"

export const fetchInspectable = async ({ id }: { id: string }) => {
  const { pages } = await basehub({
    next: { revalidate: 30 }
  }).query({
    pages: {
      inspectables: {
        inspectableList: {
          __args: {
            filter: {
              mesh: {
                eq: id
              }
            }
          },
          items: {
            _title: true,
            mesh: true,
            specs: {
              items: {
                _id: true,
                _title: true,
                value: true
              }
            },
            description: {
              json: {
                content: true
              }
            }
          }
        }
      }
    }
  })

  return pages.inspectables.inspectableList.items[0]
}

export type Inspectable = Awaited<ReturnType<typeof fetchInspectable>>
