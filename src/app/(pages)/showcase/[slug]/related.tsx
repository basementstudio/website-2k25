import Image from "next/image"
import Link from "next/link"

import { Arrow } from "@/components/primitives/icons/arrow"
import { IMAGE_FRAGMENT } from "@/lib/basehub/fragments"
import { client } from "@/service/basehub"
import { cn } from "@/utils/cn"

export async function RelatedProjects({
  baseSlug,
  className
}: {
  baseSlug: string
  className?: string
}) {
  const allPosts = await client().query({
    pages: {
      showcase: {
        projectList: {
          items: {
            _id: true
          }
        }
      }
    }
  })

  const entry = await client().query({
    pages: {
      showcase: {
        projectList: {
          __args: {
            first: 2,
            skip: Math.floor(
              Math.random() *
                (allPosts.pages.showcase.projectList.items.length - 1)
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
              _slug: true,
              icon: IMAGE_FRAGMENT
            }
          }
        }
      }
    }
  })

  return (
    <div className={cn("mt-auto flex flex-col gap-2", className)}>
      <h4 className="text-mobile-h4 text-brand-g1 lg:text-h4">More Projects</h4>

      <ul className="flex flex-col divide-y divide-brand-w1/20">
        <div />
        {entry.pages.showcase.projectList.items.map((item, index) => (
          <Link
            href={`/showcase/${item.project?._slug}`}
            key={index}
            className="flex items-center justify-between pb-1.75 pt-1.5 !text-p font-normal text-brand-w2 transition-colors duration-300 hover:text-brand-w1"
          >
            <span className="flex items-center gap-1.75">
              {item.project?.icon ? (
                <span className="relative size-4.5 overflow-hidden rounded-full border border-brand-w1/20 bg-brand-g2">
                  <Image
                    src={item.project?.icon?.url}
                    width={16}
                    height={16}
                    className="object-cover"
                    alt={item.project?.icon?.alt || "Client logo"}
                  />
                </span>
              ) : null}
              <span
                className="line-clamp-1 flex-1"
                title={item.project?._title}
              >
                {item.project?._title}
              </span>
            </span>
            <Arrow className="size-4" />
          </Link>
        ))}
        <div />
      </ul>
    </div>
  )
}
