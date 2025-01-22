import { basehub } from "basehub"
import Image from "next/image"
import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"
import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"

export async function RelatedProjects({ baseSlug }: { baseSlug: string }) {
  const allPosts = await basehub({ cache: "no-store" }).query({
    pages: {
      projects: {
        projectList: {
          items: {
            _id: true
          }
        }
      }
    }
  })

  const entry = await basehub({ cache: "no-store" }).query({
    pages: {
      projects: {
        projectList: {
          __args: {
            first: 2,
            skip: Math.floor(
              Math.random() *
                (allPosts.pages.projects.projectList.items.length - 1)
            ),

            filter: {
              project: {
                _sys_slug: {
                  notEq: baseSlug
                }
              }
            }
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

      <ul className="flex flex-col divide-y divide-brand-w1/20">
        <div />
        {entry.pages.projects.projectList.items.map((item, index) => (
          <Link
            href={`/projects/${item.project?._slug}`}
            key={index}
            className="pb-1.75 flex items-center justify-between pt-1.5 text-p font-normal text-brand-w2 transition-colors duration-300 hover:text-brand-w1"
          >
            <span className="gap-1.75 flex items-center">
              {item.icon ? (
                <span className="relative size-4.5 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                  <Image
                    src={item.icon?.url}
                    fill
                    alt={item.icon?.alt || "Client logo"}
                  />
                </span>
              ) : null}
              {item.project?._title}
            </span>
            <Arrow className="size-4" />
          </Link>
        ))}
        <div />
      </ul>
    </div>
  )
}
