"use client"

import type { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { useActionState } from "react"

import { subscribe } from "@/app/actions/subscribe"
import { Arrow } from "@/components/primitives/icons/arrow"
import { Input } from "@/components/primitives/input"
import { cn } from "@/utils/cn"

interface StayConnectedProps {
  content: RichTextNode[]
  className?: string
}

const initialState = {
  success: false,
  message: ""
}

export const StayConnected = ({ content, className }: StayConnectedProps) => {
  const [state, formAction] = useActionState(subscribe, initialState)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
        state.success = false
      }, 2500)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <div className={cn("flex-col gap-6 lg:flex", className)}>
      <div className="flex max-w-[26.25rem] flex-col gap-4">
        <RichText
          content={content}
          components={{
            h3: ({ children }) => (
              <p className="text-f-p-mobile lg:text-f-h4 !text-pretty text-brand-w2">
                {children}
              </p>
            ),
            p: ({ children }) => (
              <p className="text-f-p-mobile lg:text-f-h4 !text-pretty text-brand-w2">
                {children}
              </p>
            )
          }}
        />
      </div>
      <form
        action={formAction}
        onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          formAction(formData)
        }}
        className="text-f-h4-mobile lg:text-f-h4 flex max-w-[26.25rem] flex-col gap-1"
      >
        <Input
          className="text-f-h4-mobile lg:text-f-h4 !h-6 !px-1"
          placeholder="Enter your Email"
          required
          type="email"
          name="email"
        />
        <button
          type="submit"
          disabled={state.success}
          className="text-f-h4-mobile lg:text-f-h4 ml-1 flex w-fit translate-y-1 items-center gap-1 overflow-hidden text-brand-g1"
        >
          <AnimatePresence mode="wait">
            {showSuccess ? (
              <motion.span
                key="success"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="text-f-h4-mobile lg:text-f-h4 !text-brand-g [height:_calc(0.89_*_1em)]"
              >
                Subscribed Succesfully
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="actionable actionable-no-underline text-f-h4-mobile lg:text-f-h4 gap-x-1"
              >
                Roll Me In <Arrow className="size-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </form>
    </div>
  )
}
