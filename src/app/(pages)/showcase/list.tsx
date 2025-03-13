import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"
import { memo, useCallback, useState } from "react"

import { Arrow } from "@/components/primitives/icons/arrow"
import { cn } from "@/utils/cn"

import { Project } from "./basehub"

const AccordionListItem = memo(
  ({
    project,
    index,
    disabled,
    isOpen,
    sectionSeen,
    onRevealFinished
  }: {
    project: Project
    index: number
    disabled: boolean
    isOpen: boolean
    sectionSeen: boolean
    onRevealFinished: () => void
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
                src={project.icon?.url ?? ""}
                alt={project.icon?.alt ?? ""}
                width={project.icon?.width ?? 0}
                height={project.icon?.height ?? 0}
                className="mb-px size-4.5 rounded-full border border-brand-w1/10"
                priority
              />
              <p>{project.client?._title}</p>
            </div>

            <p className="relative col-start-5 col-end-11 inline-flex flex-wrap text-pretty text-p leading-none text-brand-w2">
              {project.categories?.map((cat, idx) => (
                <span key={cat._title}>
                  {cat._title}
                  {idx !== (project.categories?.length ?? 0) - 1 && (
                    <span className="inline-block px-1 text-brand-g1">,</span>
                  )}
                </span>
              ))}
            </p>
            <p className="relative col-start-11 col-end-12 text-left text-p text-brand-w2">
              {project.year}
            </p>
            <Link
              href={`/showcase/${project?._slug}`}
              className="view-project relative col-start-12 col-end-13 space-x-px text-right text-p text-brand-w2 opacity-0 transition-opacity duration-300"
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
              "group",
              "col-span-12",
              "overflow-hidden",
              "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
              disabled && "opacity-30"
            )}
          >
            <div className="grid grid-cols-12 gap-2 pb-0.5 pt-4">
              {project.showcase?.items.map((item, imgIndex, array) => {
                const MotionWrapper = ({
                  children
                }: {
                  children: React.ReactNode
                }) => (
                  <motion.div
                    key={imgIndex}
                    initial={{ opacity: 0 }}
                    whileInView={{
                      opacity:
                        index === 0 && !sectionSeen ? [null, 1, 0, 1, 0, 1] : 1
                    }}
                    transition={{
                      delay:
                        (index === 0 && !sectionSeen
                          ? imgIndex * 0.1
                          : imgIndex * 0.05) + 0.1,
                      duration: 0.3
                    }}
                    onAnimationComplete={() => {
                      if (array.length === imgIndex + 1 && !sectionSeen) {
                        onRevealFinished()
                      }
                    }}
                    className="col-span-2"
                  >
                    {children}
                  </motion.div>
                )

                if (item.video) {
                  return (
                    <MotionWrapper key={imgIndex}>
                      <video
                        key={imgIndex}
                        src={item.video.url}
                        autoPlay
                        playsInline
                        muted
                        className="col-span-2"
                      />
                    </MotionWrapper>
                  )
                }

                return (
                  <MotionWrapper key={imgIndex}>
                    <Image
                      key={imgIndex}
                      src={item.image?.url ?? ""}
                      alt={item.image?.alt ?? ""}
                      width={item.image?.width ?? 0}
                      height={item.image?.height ?? 0}
                      className="col-span-2"
                      blurDataURL={item.image?.blurDataURL ?? ""}
                      placeholder="blur"
                      priority
                    />
                  </MotionWrapper>
                )
              })}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Item>
    )
  }
)
AccordionListItem.displayName = "AccordionListItem"

export const List = memo(
  ({
    projects,
    isProjectDisabled
  }: {
    projects: Project[]
    isProjectDisabled: (project: Project) => boolean
  }) => {
    const [itemOpen, setItemOpen] = useState<string>()
    const [sectionSeen, setSectionSeen] = useState<boolean>(false)

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
            project={item}
            index={index}
            disabled={isProjectDisabled(item)}
            isOpen={itemOpen === index.toString()}
            sectionSeen={sectionSeen}
            onRevealFinished={() => setSectionSeen(true)}
          />
        ))}
      </AccordionPrimitive.Root>
    )
  }
)
List.displayName = "List"
