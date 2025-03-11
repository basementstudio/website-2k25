import Image from "next/image"
import { memo } from "react"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
import { cn } from "@/utils/cn"

import type { QueryType } from "./query"
import styles from "./testimonials.module.css"

const TestimonialAvatar = memo(
  ({
    avatar
  }: {
    avatar: QueryType["company"]["testimonials"]["services"]["avatar"]
  }) => {
    if (!avatar) return null

    return (
      <div className="with-dots">
        <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
          <Image
            alt={avatar.alt || ""}
            blurDataURL={avatar.blurDataURL}
            className="size-12 lg:size-16"
            draggable={false}
            height={avatar.height}
            width={avatar.width}
            placeholder="blur"
            quality={100}
            sizes="(max-width: 768px) 48px, 64px"
            src={avatar.url}
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
    handleLink,
    role
  }: {
    name: string | null
    handle: string | null
    handleLink: string | null
    role: QueryType["company"]["testimonials"]["services"]["role"]
  }) => (
    <div className="flex flex-col justify-center gap-1">
      <p className="inline-flex items-center gap-x-2 text-mobile-h4 text-brand-w1 lg:text-h4">
        {name} <span>-</span>
        <Link
          href={handleLink || ""}
          className="actionable text-mobile-h4 lg:text-h4"
        >
          {handle}
        </Link>
      </p>

      <div className="[&_*]:text-mobile-h4 [&_*]:text-brand-g1 lg:[&_*]:text-h4">
        <RichText>{role?.json.content}</RichText>
      </div>
    </div>
  )
)

TestimonialAuthor.displayName = "TestimonialAuthor"

const TestimonialsComponent = ({ data }: { data: QueryType }) => {
  const testimonial = data.company.testimonials.services

  return (
    <div className="grid-layout !gap-y-8">
      <div className={cn("relative col-span-full", styles.root)}>
        <div
          className={cn(
            "mx-auto max-w-[1440px] text-center [&_a]:no-underline [&_p]:relative [&_p]:z-10 [&_p]:text-balance [&_p]:!text-mobile-h1 [&_p]:text-brand-w1 lg:[&_p]:!text-h1"
          )}
        >
          <RichText>{testimonial.content?.json.content}</RichText>
        </div>
        <div className="pointer-events-none absolute inset-0" />
      </div>

      <div className="col-span-full mx-auto flex gap-x-4 lg:col-start-5 lg:col-end-9">
        <TestimonialAvatar avatar={testimonial.avatar} />

        <TestimonialAuthor
          name={testimonial.name}
          handle={testimonial.handle}
          handleLink={testimonial.handleLink || ""}
          role={testimonial.role}
        />
      </div>
    </div>
  )
}

export const Testimonials = memo(TestimonialsComponent)
