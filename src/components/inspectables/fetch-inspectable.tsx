"use server";

import { basehub } from "basehub";

export const fetchInspectable = async ({ id }: { id: string }) => {
  const { threeDInteractions } = await basehub({
    next: { revalidate: 30 },
  }).query({
    threeDInteractions: {
      inspectables: {
        inspectableList: {
          __args: {
            filter: {
              _sys_id: {
                eq: id,
              },
            },
          },
          items: {
            _title: true,
            specs: {
              items: {
                _id: true,
                _title: true,
                value: true,
              },
            },
            description: {
              json: {
                content: true,
              },
            },
          },
        },
      },
    },
  });

  return threeDInteractions.inspectables.inspectableList.items[0];
};

export type Inspectable = Awaited<ReturnType<typeof fetchInspectable>>;
