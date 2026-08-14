"use client"

import {
  ArrowDownIcon,
  CalendarScheduleIcon,
  EarthIcon
} from "@/components/icons/icons"

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
      <div className="flex flex-col items-start gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CalendarScheduleIcon className="size-4 text-brand-w2 lg:size-5" />
            <p className="text-sm font-semibold leading-5 tracking-[-0.02em] text-brand-w2 lg:text-[1.125rem]">
              {employmentType || "Full-time"}
            </p>
          </div>
          {location ? (
            <>
              <span className="inline-block size-1 bg-brand-g1" />
              <div className="flex items-center gap-1">
                <EarthIcon className="size-4 text-brand-w2 lg:size-5" />
                <p className="text-sm font-semibold leading-5 tracking-[-0.02em] text-brand-w2 lg:text-[1.125rem]">
                  {location}
                </p>
              </div>
            </>
          ) : null}
        </div>
        <button
          type="button"
          onClick={scrollToApply}
          className="actionable-opacity group flex items-center gap-2 rounded-sm bg-brand-w1 px-3 py-1.5 text-sm font-semibold leading-5 tracking-[-0.02em] text-brand-k [--anim-duration:250ms] lg:text-[1.125rem]"
        >
          <span className="group-hover:underline">Apply now</span>
          <ArrowDownIcon className="size-3" />
        </button>
      </div>
      <hr className="border-brand-w1/20" />
    </div>
  )
}
