import Image from "next/image"
import { memo } from "react"

import { Link } from "@/components/primitives/link"
import { getImageUrl } from "@/service/sanity/helpers"
import { cn } from "@/utils/cn"

import type { ServiceTestimonial } from "./sanity"
import styles from "./testimonials.module.css"

const TestimonialAvatar = memo(
  ({ avatar }: { avatar: ServiceTestimonial["avatar"] }) => {
    const img = getImageUrl(avatar)
    if (!img) return null

    return (
      <div className="with-dots">
        <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
          <Image
            alt={img.alt || ""}
            blurDataURL={img.blurDataURL}
            className="size-16 lg:size-24"
            draggable={false}
            height={img.height}
            width={img.width}
            placeholder="blur"
            quality={100}
            sizes="(max-width: 1024px) 192px, 288px"
            src={img.src}
          />
        </div>
      </div>
    )
  }
)

TestimonialAvatar.displayName = "TestimonialAvatar"

const TestimonialAuthor = memo(
  ({
    name,
    handle,
    role
  }: {
    name: string | null
    handle: string | null
    role: string | null
  }) => (
    <div className="flex flex-col justify-center gap-1">
      <p className="inline-flex items-center gap-x-2 text-f-h4-mobile text-brand-w1 lg:text-f-h4">
        {name} <span>-</span>
        {handle && (
          <Link
            href={`https://x.com/${handle.replace("@", "")}`}
            className="text-f-h4-mobile lg:text-f-h4"
            target="_blank"
          >
            <span className="actionable">{handle}</span>
          </Link>
        )}
      </p>

      {role && (
        <p className="text-f-h4-mobile text-brand-g1 lg:text-f-h4">{role}</p>
      )}
    </div>
  )
)

TestimonialAuthor.displayName = "TestimonialAuthor"

const TestimonialsComponent = ({
  data
}: {
  data: ServiceTestimonial
}) => {
  return (
    <div className="grid-layout !gap-y-8">
      <div className={cn("relative col-span-full", styles.root)}>
        <div
          className={cn(
            "mx-auto max-w-[1440px] text-center [&_a]:no-underline [&_p]:relative [&_p]:z-10 [&_p]:!text-f-h1-mobile [&_p]:text-brand-w1 lg:[&_p]:!text-f-h1"
          )}
        >
          {data.content && (
            <p className="relative z-10 !text-f-h1-mobile text-brand-w1 lg:!text-f-h1">
              {data.content}
            </p>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0" />
      </div>

      <div className="col-span-full mx-auto flex gap-x-4 lg:col-start-3 lg:col-end-11">
        <TestimonialAvatar avatar={data.avatar} />

        <TestimonialAuthor
          name={data.name}
          handle={data.handle}
          role={data.role}
        />
      </div>
    </div>
  )
}

export const Testimonials = memo(TestimonialsComponent)
