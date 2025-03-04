"use client"
import Image from "next/image"
import { useEffect, useRef } from "react"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"
import { cn } from "@/utils/cn"

import { QueryType } from "./query"
import styles from "./testimonials.module.css"

export const Testimonials = ({ data }: { data: QueryType }) => {
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
        <div className="pointer-events-none absolute inset-0"></div>
      </div>

      <div className="col-span-full mx-auto flex gap-x-4 lg:col-start-5 lg:col-end-9">
        {testimonial.avatar ? (
          <div className="with-dots">
            <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
              <Image
                src={testimonial.avatar?.url}
                alt={testimonial.avatar?.alt || ""}
                width={testimonial.avatar?.width}
                height={testimonial.avatar?.height}
                className="size-12 lg:size-16"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col justify-center gap-1">
          <p className="inline-flex items-center gap-x-2 text-mobile-h4 text-brand-w1 lg:text-h4">
            {testimonial.name} <span>-</span>
            <Link
              href={testimonial.handleLink || ""}
              className="actionable text-mobile-h4 lg:text-h4"
            >
              {testimonial.handle}
            </Link>
          </p>

          <div className="[&_*]:text-mobile-h4 [&_*]:text-brand-g1 lg:[&_*]:text-h4">
            <RichText>{testimonial.role?.json.content}</RichText>
          </div>
        </div>
      </div>
    </div>
  )
}
