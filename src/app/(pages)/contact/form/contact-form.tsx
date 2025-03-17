"use client"

import { SubmitHandler, useForm } from "react-hook-form"
import { ContactInput } from "./contact-input"
import { useEffect, useState } from "react"
import { ContactStatus } from "./contact-status"

type Inputs = {
  name: string
  company: string
  email: string
  budget: string
  message: string
}

export const ContactForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<Inputs>()

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setIsSubmitted(false)
    }
  }, [errors])

  useEffect(() => {
    if (isSubmitted || submitError) {
      const timer = setTimeout(() => {
        setIsSubmitted(false)
        setSubmitError("")
        reset()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [isSubmitted, submitError])

  const getFirstErrorMessage = () => {
    if (errors.email) return errors.email.message
    if (errors.message) return errors.message.message
    return ""
  }

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    setSubmitting(true)
    setIsSubmitted(false)
    setSubmitError("")
  }

  return (
    <form
      className="col-span-7 col-start-6 row-span-2 flex flex-col justify-between gap-6"
      aria-label="Contact form or additional information"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex h-full flex-col">
        <ContactInput placeholder="Name" {...register("name")} />
        <ContactInput placeholder="Company" {...register("company")} />
        <ContactInput
          placeholder="Email"
          type="email"
          {...register("email", { required: "Email is required" })}
        />
        <ContactInput placeholder="Budget (optional)" {...register("budget")} />
        <ContactInput
          placeholder="Message"
          type="textarea"
          {...register("message", { required: "Message is required" })}
        />
      </div>
      <div className="flex flex-col items-start justify-between gap-4 xl:flex-row">
        <button
          type="submit"
          className="flex h-[35px] items-start gap-3 xl:h-[56px]"
        >
          <p className="text-f-h1-mobile font-semibold leading-none xl:text-[56px] xl:tracking-[-2.24px]">
            Submit Message
          </p>

          <svg
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25.44 30.3124V5.61643H0.856L6.4 0.128427L30.984 0.184426V24.8244L25.44 30.3124ZM0.408 25.8324L25.664 0.520425L30.648 5.44842L5.336 30.7604L0.408 25.8324Z"
              fill="#E6E6E6"
            />
          </svg>
        </button>
        <ContactStatus
          isSubmitted={isSubmitted}
          error={submitError || getFirstErrorMessage()}
          isSubmitting={submitting}
        />
      </div>
    </form>
  )
}
