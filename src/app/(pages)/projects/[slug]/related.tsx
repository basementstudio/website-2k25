import { basehub } from "basehub"
import Image from "next/image"
import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"
import { InfoItem } from "@/components/primitives/info-item"
import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export async function RelatedProjects({
  categories
}: {
  categories: string[]
}) {
  const entry = await basehub({ cache: "no-store" }).query({
    pages: {
      projects: {
        projectList: {
          __args: {
            first: 2
          },
          items: {
            project: {
              _title: true,
              _slug: true
            },
            icon: IMAGE_FRAGMENT
          }
        }
      }
    }
  })

  return (
    <div className="mt-auto flex flex-col gap-2">
      <h4 className="text-h4 text-brand-g1">More Projects</h4>

      <ul className="flex flex-col divide-y divide-brand-w1/30">
        <div />
        {entry.pages.projects.projectList.items.map((item) => (
          <InfoItem
            key={item.project?._slug}
            label={
              <span className="flex items-center gap-1">
                <span className="relative size-3 overflow-hidden rounded-full bg-brand-g2">
                  <Image
                    src={item.icon?.url ?? ""}
                    alt={item.icon?.alt ?? ""}
                    fill
                    className="object-cover"
                  />
                </span>
                <span className="text-p text-brand-w1">
                  {item.project?._title}
                </span>
              </span>
            }
            labelClassName="col-span-5"
            valueClassName="col-span-1 flex items-center justify-end"
            value={
              <Link
                href={`/projects/${item.project?._slug}`}
                className="text-p text-brand-w1"
              >
                <Arrow className="size-4" />
              </Link>
            }
          />
        ))}
        <div />
      </ul>
    </div>
  )
}
