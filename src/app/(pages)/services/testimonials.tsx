import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { RichText } from "@/components/primitives/rich-text"

import { QueryType } from "./query"

export const Testimonials = ({ data }: { data: QueryType }) => {
  const testimonial = data.company.testimonials.services

  return (
    <div className="grid-layout !gap-y-8">
      <div className="relative col-span-12 text-center">
        <div className="mx-auto max-w-[1440px] [&_a]:no-underline [&_p]:text-balance [&_p]:text-h1 [&_p]:text-brand-w1">
          <RichText>{testimonial.content?.json.content}</RichText>
        </div>

        <div className="absolute inset-0 -mt-[0.5625rem] flex flex-col [&>*]:mt-[4.1875rem]">
          <div className="h-px w-full bg-brand-w1/30" />
          <div className="h-px w-full bg-brand-w1/30" />
          <div className="h-px w-full bg-brand-w1/30" />
        </div>
      </div>

      <div className="col-start-5 col-end-9 mx-auto flex gap-x-4">
        {testimonial.avatar ? (
          <div className="with-dots">
            <div className="after:pointer-events-none after:absolute after:inset-0 after:border after:border-brand-w1/20">
              <Image
                src={testimonial.avatar?.url}
                alt={testimonial.avatar?.alt || ""}
                width={testimonial.avatar?.width}
                height={testimonial.avatar?.height}
                className="size-16"
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col justify-center gap-1">
          <p className="inline-flex items-center gap-x-2 text-h4 text-brand-w1">
            {testimonial.name} <span>-</span>
            <Link
              href={testimonial.handleLink || ""}
              className="actionable text-h4"
            >
              {testimonial.handle}
            </Link>
          </p>

          <div className="[&_*]:text-h4 [&_*]:text-brand-g1">
            <RichText>{testimonial.role?.json.content}</RichText>
          </div>
        </div>
      </div>
    </div>
  )
}
