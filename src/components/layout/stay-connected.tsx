"use client"

import type { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState, startTransition } from "react"
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
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    startTransition(() => {
      formAction(new FormData(e.currentTarget))
    })
    setIsLoading(false)
  }

  return (
    <div className={cn("flex-col gap-6 lg:flex", className)}>
      <div className="flex max-w-[26.25rem] flex-col gap-4">
        <RichText
          content={content}
          components={{
            h3: ({ children }) => (
              <p className="!text-pretty text-f-p-mobile text-brand-w2 lg:text-f-h4">
                {children}
              </p>
            ),
            p: ({ children }) => (
              <p className="!text-pretty text-f-p-mobile text-brand-w2 lg:text-f-h4">
                {children}
              </p>
            )
          }}
        />
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex max-w-[26.25rem] flex-col gap-4 text-f-h4-mobile lg:text-f-h4"
      >
        <Input
          className="!h-6 !px-1 text-f-h4-mobile lg:text-f-h4"
          placeholder="Enter your Email"
          required
          type="email"
          name="email"
        />
        <button
          type="submit"
          disabled={state.success || isLoading}
          className="flex w-fit translate-y-1 items-center gap-1 overflow-hidden text-f-h4-mobile lg:text-f-h4"
        >
          <motion.div
            animate={{
              color: state.success ? "#00ff9b" : state.message.includes("already") ? "#ff6b6b" : "#666666"
            }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.span
                  key="success"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                  className="actionable pointer-events-none gap-1"
                >
                  Subscribed Succesfully
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: state.success ? 1 : 0 }}
                    transition={{ duration: 0.1, ease: "easeOut" }}
                  >
                    <Checkmark
                      className="scale-75 text-brand-g"
                      state={state.success}
                    />
                  </motion.span>
                </motion.span>
              ) : state.message.includes("already") ? (
                <motion.span
                  key="error"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="actionable actionable-no-underline flex h-[1.5em] items-center gap-x-1 text-f-h4-mobile lg:text-f-h4"
                >
                  Already Registered
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="actionable actionable-no-underline flex h-[1.5em] items-center gap-x-1 text-f-h4-mobile lg:text-f-h4"
                >
                  {isLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        ⭕
                      </motion.span>
                      <span>Rolling...</span>
                    </>
                  ) : (
                    <>
                      Roll Me In <Arrow className="size-5" />
                    </>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </form>
    </div>
  )
}

const Checkmark = ({
  className,
  state
}: {
  className?: string
  state: boolean
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
