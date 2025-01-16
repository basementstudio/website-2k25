import * as AccordionPrimitive from "@radix-ui/react-accordion"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { cn } from "@/utils/cn"

import { Categories } from "./categories"
import { FilteredProjectType } from "./project-list"

export const List = ({ projects }: { projects: FilteredProjectType[] }) => {
  const [itemOpen, setItemOpen] = useState<string>()

  useEffect(() => {
    if (itemOpen && projects[parseInt(itemOpen)].disabled) {
      setItemOpen("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects])

  return (
    <AccordionPrimitive.Root
      className="m-0 w-full p-0"
      type="single"
      collapsible
      value={itemOpen}
      onValueChange={setItemOpen}
    >
      {projects.map((item, index) => (
        <AccordionPrimitive.Item
          key={index}
          className={cn(
            "grid-layout [&[data-state=closed]_.view-project]:opacity-0",
            item.disabled
              ? "[&[data-state=open]_.view-project]:opacity-30"
              : "[&[data-state=open]_.view-project]:opacity-100"
          )}
          value={index.toString()}
        >
          <AccordionPrimitive.Trigger
            className={cn(
              "[&[data-state=open]_.diagonal-lines]:opacity-0",
              "group relative col-span-12 grid grid-cols-12 grid-rows-[repeat(2,auto)] items-center gap-x-2 gap-y-0 border-t border-brand-w1/20 pb-1.5 pt-1.25 transition-all duration-300"
            )}
            disabled={item.disabled}
          >
            {!item.disabled && (
              <div className="diagonal-lines group-hover:with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            )}
            <div
              className={cn(
                "contents",
                item.disabled &&
                  "duration-300 [&>*]:opacity-30 [&>*]:transition-opacity"
              )}
            >
              <div className="relative col-span-5 flex items-center gap-2 text-subheading text-brand-w2 transition-opacity duration-300">
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
                className="relative col-start-7 col-end-10"
                categories={
                  item.project?.categories?.map((c) => c._title) ?? []
                }
              />
              <p className="relative col-start-10 col-end-11 text-left text-paragraph text-brand-w2">
                {item.project?.year}
              </p>
              <Link href={`/projects/${item.project?._slug}`}>
                <p className="view-project relative col-start-12 col-end-13 text-right text-paragraph text-brand-w2 opacity-0 transition-opacity duration-300">
                  <span className="actionable">View Project</span> →
                </p>
              </Link>
            </div>

            <AccordionPrimitive.Content
              className={cn(
                "col-span-12",
                "overflow-hidden transition-opacity duration-300 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
                item.disabled && "opacity-30"
              )}
            >
              <div className="grid grid-cols-12 gap-2 pb-0.5 pt-10.5">
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
}
