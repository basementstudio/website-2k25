"use client"

import { ArrowDownIcon } from "@/components/icons/icons"

interface JobMetaProps {
  type: string
  employmentType: string
  location: string
}

export const JobMeta = ({ type, employmentType, location }: JobMetaProps) => {
  const scrollToApply = () => {
    document.getElementById("apply")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    })
  }

  return (
    <div className="flex w-full flex-col gap-3 lg:max-w-[846px]">
      {type ? (
        <div className="flex gap-1">
          <p className="h-max w-max bg-brand-g2 px-1 text-f-p-mobile text-brand-w2 lg:text-f-p">
            Careers
          </p>
          <p className="h-max w-max bg-brand-g2 px-1 text-f-p-mobile text-brand-w2 lg:text-f-p">
            {type}
          </p>
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-x-2 text-brand-w2">
          {location ? (
            <>
              {location}
              <span className="inline-block size-1 bg-brand-g1" />
            </>
          ) : null}
          {employmentType || "Full-time"}
        </p>
        <button
          type="button"
          onClick={scrollToApply}
          className="actionable actionable-no-underline group flex items-center gap-2 rounded-sm text-f-p-mobile text-brand-w1 lg:text-f-p"
        >
          <span className="group-hover:actionable group-hover:actionable-inanimate">
            Apply now
          </span>
          <ArrowDownIcon className="size-3 animate-bounce" />
        </button>
      </div>
      <hr className="border-brand-w1/20" />
    </div>
  )
}
