import * as AccordionPrimitive from "@radix-ui/react-accordion"
import Image from "next/image"

import { cn } from "@/utils/cn"

import { Categories } from "./categories"
import { FilteredProjectType } from "./project-list"

export const List = ({ projects }: { projects: FilteredProjectType[] }) => (
  <AccordionPrimitive.Root className="m-0 w-full p-0" type="single" collapsible>
    {projects.map((item, index) => (
      <AccordionPrimitive.Item
        key={index}
        className="grid-layout [&[data-state=open]_.view-project]:opacity-100"
        value={index.toString()}
      >
        <AccordionPrimitive.Trigger className="col-span-12 grid grid-cols-12 grid-rows-[repeat(2,auto)] items-center gap-x-2 gap-y-0 border-t border-brand-w1/20 pb-1.5 pt-1.25 transition-all duration-300">
          <div
            className={cn(
              "contents cursor-pointer",
              item.disabled && "[&>*]:opacity-30"
            )}
          >
            <div className="col-span-5 flex items-center gap-2 text-subheading text-brand-w2">
              <Image
                src={item.icon?.url ?? ""}
                alt={item.icon?.alt ?? ""}
                width={item.icon?.width ?? 0}
                height={item.icon?.height ?? 0}
                className="mb-px size-4.5 rounded-full border border-brand-w1/10"
              />
              <p>{item.project?.client?._title}</p>
            </div>
            <Categories
              className="col-start-7 col-end-10"
              categories={item.project?.categories?.map((c) => c._title) ?? []}
            />
            <p className="col-start-10 col-end-11 text-left text-paragraph text-brand-w2">
              {item.project?.year}
            </p>
            <p className="view-project col-start-12 col-end-13 text-right text-paragraph text-brand-w2 opacity-0 transition-opacity duration-300">
              <span className="actionable">View Project</span> →
            </p>
          </div>

          <AccordionPrimitive.Content
            className={cn(
              "col-span-12",
              "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            )}
          >
            <div className="pt-10.5 grid grid-cols-12 gap-2 pb-0.5">
              {item.showcase.items.map((item, index) => (
                <Image
                  key={index}
                  src={item.image?.url ?? ""}
                  alt={item.image?.alt ?? ""}
                  width={item.image?.width ?? 0}
                  height={item.image?.height ?? 0}
                  className="col-span-2"
                />
              ))}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Item>
    ))}
  </AccordionPrimitive.Root>
)
