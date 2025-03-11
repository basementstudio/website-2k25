import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { motion } from "motion/react"
import Image from "next/image"
import { memo, useCallback, useEffect, useState } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"

import { FilteredProjectType } from "./project-list"

const AccordionListItem = memo(
  ({
    item,
    index,
    disabled,
    isOpen
  }: {
    item: FilteredProjectType
    index: number
    disabled: boolean
    isOpen: boolean
  }) => {
    return (
      <AccordionPrimitive.Item
        key={index}
        className={cn(
          "grid-layout [&:last-of-type>button]:border-b",
          "[&[data-state=open]]:will-change-[opacity,transform]"
        )}
        value={index.toString()}
      >
        <AccordionPrimitive.Trigger
          className={cn(
            "[&[data-state=open]_.diagonal-lines]:opacity-0",
            "c group relative col-span-12 grid grid-cols-12 grid-rows-[repeat(2,auto)] items-center gap-x-2 gap-y-0 border-t border-brand-w1/20 pb-1.5 pt-1.25 transition-all duration-300",
            disabled && "pointer-events-none",
            isOpen ? "cursor-n-resize" : "cursor-ns-resize"
          )}
          disabled={disabled}
        >
          {!disabled && (
            <div className="diagonal-lines group-hover:with-diagonal-lines pointer-events-none !absolute -bottom-px -top-px left-0 right-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          )}
          <div
            className={cn(
              "contents",
              disabled &&
                "duration-300 [&>*]:opacity-30 [&>*]:transition-opacity"
            )}
          >
            <div className="relative col-span-4 flex items-center gap-2 text-h3 text-brand-w2 transition-opacity duration-300">
              <Image
                src={item.project?.icon?.url ?? ""}
                alt={item.project?.icon?.alt ?? ""}
                width={item.project?.icon?.width ?? 0}
                height={item.project?.icon?.height ?? 0}
                className="mb-px size-4.5 rounded-full border border-brand-w1/10"
                priority
              />
              <p>{item.project?.client?._title}</p>
            </div>

            <p className="relative col-start-5 col-end-11 inline-flex flex-wrap text-pretty text-p leading-none text-brand-w2">
              {item.project?.categories?.map((cat, idx) => (
                <span key={cat._title}>
                  {cat._title}
                  {idx !== (item.project?.categories?.length ?? 0) - 1 && (
                    <span className="inline-block px-1 text-brand-g1">,</span>
                  )}
                </span>
              ))}
            </p>
            <p className="relative col-start-11 col-end-12 text-left text-p text-brand-w2">
              {item.project?.year}
            </p>
            <Link
              href={`/showcase/${item.project?._slug}`}
              className="view-project relative col-start-12 col-end-13 space-x-px text-right text-p text-brand-w2 duration-300"
            >
              <span className="actionable actionable-no-underline gap-x-1">
                <span className="actionable actionable-inanimate">
                  View Work
                </span>
                <Arrow className="inline-block size-4" />
              </span>
            </Link>
          </div>

          <AccordionPrimitive.Content
            className={cn(
              "col-span-12",
              "overflow-hidden transition-[transform,opacity,height] duration-300",
              "data-[state=closed]:h-0",
              "data-[state=open]:h-auto",
              disabled && "opacity-30"
            )}
            forceMount
          >
            <div className="grid grid-cols-12 gap-2 pb-0.5 pt-4">
              {item.project?.showcase?.items.slice(0, 6).map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  whileInView={{
                    opacity: [null, 1, 0, 1, 0, 1]
                  }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.3
                  }}
                  className="col-span-2"
                >
                  <Image
                    src={item.image?.url ?? ""}
                    alt={item.image?.alt ?? ""}
                    width={item.image?.width ?? 0}
                    height={item.image?.height ?? 0}
                    sizes="15vw"
                    priority={index === 0}
                  />
                </motion.div>
              ))}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Item>
    )
  }
)
AccordionListItem.displayName = "AccordionListItem"

export const List = memo(
  ({ projects }: { projects: FilteredProjectType[] }) => {
    const [itemOpen, setItemOpen] = useState<string>()

    useEffect(() => {
      if (itemOpen && projects[parseInt(itemOpen)].disabled) {
        setItemOpen("")
      }
    }, [projects, itemOpen])

    const handleValueChange = useCallback((value: string) => {
      setItemOpen(value)
    }, [])

    return (
      <AccordionPrimitive.Root
        className="m-0 w-full p-0"
        type="single"
        collapsible
        value={itemOpen}
        onValueChange={handleValueChange}
        defaultValue="0"
      >
        {projects.map((item, index) => (
          <AccordionListItem
            key={item._title + index}
            item={item}
            index={index}
            disabled={!!item.disabled}
            isOpen={itemOpen === index.toString()}
          />
        ))}
      </AccordionPrimitive.Root>
    )
  }
)
List.displayName = "List"
