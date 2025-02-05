import { RichText } from "basehub/react-rich-text"
import Image from "next/image"

import { Link } from "@/components/primitives/link"
import { formatDate, formatTestimonialDate } from "@/utils/format-date"

import { QueryType } from "./query"

export const Testimonials = ({ data }: { data: QueryType }) => {
  const testimonial = data.company.testimonials.services

  return (
    <div className="grid-layout !gap-y-8">
      <div className="relative col-span-12 text-center text-h1 text-brand-w1">
        <div className="mx-auto max-w-[1440px] [&_p]:text-pretty">
          <RichText>{testimonial.content?.json.content}</RichText>
        </div>

        <div className="absolute inset-0 -mt-[0.5625rem] flex flex-col [&>*]:mt-[4.1875rem]">
          <div className="h-px w-full bg-brand-w1/30" />
          <div className="h-px w-full bg-brand-w1/30" />
          <div className="h-px w-full bg-brand-w1/30" />
          <div className="h-px w-full bg-brand-w1/30" />
        </div>
      </div>

      <div className="col-start-5 col-end-9 mx-auto flex gap-x-2">
        {testimonial.avatar ? (
          <Image
            src={testimonial.avatar?.url}
            alt={testimonial.avatar?.alt || ""}
            width={testimonial.avatar?.width}
            height={testimonial.avatar?.height}
            className="size-14"
          />
        ) : null}

        <p className="text-h4 text-brand-w2">
          {testimonial.name}{" "}
          <Link
            href={testimonial.handleLink || ""}
            className="actionable text-h4 text-brand-w1"
          >
            {testimonial.handle}
          </Link>
        </p>

        {testimonial.date ? (
          <p className="text-h4 text-brand-g1">
            {formatTestimonialDate(testimonial.date)}
          </p>
        ) : null}
      </div>
    </div>
  )
}
