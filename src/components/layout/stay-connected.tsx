"use client"

import type { RichTextNode } from "basehub/api-transaction"
import { RichText } from "basehub/react-rich-text"
import { AnimatePresence, motion } from "motion/react"
import { useState, useEffect, startTransition } from "react"
import { useActionState } from "react"

import { subscribe } from "@/app/actions/subscribe"
import { Arrow } from "@/components/primitives/icons/arrow"
import { Input } from "@/components/primitives/input"
import { cn } from "@/utils/cn"

interface StayConnectedProps {
  content: RichTextNode[]
  className?: string
}

type FormState = "idle" | "loading" | "success" | "error"
type ErrorType = "already_registered" | "invalid_email" | "general_error"

export const StayConnected = ({ content, className }: StayConnectedProps) => {
  const [state, formAction] = useActionState(subscribe, {
    success: false,
    message: ""
  })
  const [formState, setFormState] = useState<FormState>("idle")
  const [errorType, setErrorType] = useState<ErrorType>("general_error")
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (formState !== "idle") return

    setFormState("loading")
    const formData = new FormData()
    formData.append("email", email)

    startTransition(() => {
      formAction(formData)
    })
  }

  useEffect(() => {
    if (state.success) {
      setFormState("success")
    } else {
      if (state.message === "already registered") {
        setFormState("error")
        setErrorType("already_registered")
      } else if (state.success) {
      } else {
        setFormState("error")
        setErrorType(
          state.message.toLowerCase().includes("email")
            ? "invalid_email"
            : "general_error"
        )
      }
    }

    setTimeout(() => {
      setFormState("idle")
      setEmail("")
      setErrorType("general_error")
    }, 2000)
  }, [state])

  const getErrorMessage = () => {
    switch (errorType) {
      case "already_registered":
        return "Already Registered"
      case "invalid_email":
        return "Invalid Email"
      case "general_error":
        return "Something went wrong"
      default:
        return "Something went wrong"
    }
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
        className="flex max-w-[26.25rem] flex-col gap-1 text-f-h4-mobile lg:text-f-h4"
      >
        <Input
          className="!h-6 !px-1 text-f-h4-mobile lg:text-f-h4"
          placeholder="Enter your Email"
          required
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (formState === "error") setFormState("idle")
          }}
          disabled={formState !== "idle"}
        />
        <button
          type="submit"
          disabled={formState !== "idle" || !email}
          className="ml-1 flex w-fit translate-y-1 items-center gap-1 overflow-hidden text-f-h4-mobile lg:text-f-h4"
        >
          <motion.div
            animate={{
              color:
                formState === "success"
                  ? "#00ff9b"
                  : formState === "error"
                    ? "#ff6b6b"
                    : formState !== "idle" || !email
                      ? "#666666"
                      : "#e6e6e6"
            }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {formState === "success" ? (
                <motion.span
                  key="success"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-x-1 text-f-h4-mobile lg:text-f-h4"
                >
                  Subscribed Successfully
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <Checkmark className="scale-75 text-brand-g" state={true} />
                  </motion.span>
                </motion.span>
              ) : formState === "error" ? (
                <motion.span
                  key="error"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-x-1 text-f-h4-mobile lg:text-f-h4"
                >
                  {getErrorMessage()}
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex items-center gap-x-1 text-f-h4-mobile lg:text-f-h4",
                    !(formState !== "idle" || !email) &&
                      "actionable actionable-no-underline"
                  )}
                >
                  Roll Me In <Arrow className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </button>
      </form>
    </div>
  )
}

const Checkmark = ({ className }: { className?: string; state: boolean }) => (
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
