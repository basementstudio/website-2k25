"use client"

import { useEffect, useState } from "react"
import { SubmitHandler, useForm } from "react-hook-form"

import { submitContactForm } from "@/actions/contact-form"

import { ContactInput } from "./contact-input"
import { ContactStatus } from "./contact-status"

export type Inputs = {
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

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setSubmitting(true)
    setIsSubmitted(false)
    setSubmitError("")

    try {
      const formData = {
        name: data.name || "",
        company: data.company || "",
        email: data.email,
        budget: data.budget || "",
        message: data.message
      }

      const result = await submitContactForm(formData)

      if (result.success) {
        setIsSubmitted(true)
        setSubmitError("")
        reset()
      } else {
        setIsSubmitted(false)
        setSubmitError(result.error || "Form submission failed")
      }
    } catch (error) {
      setIsSubmitted(false)
      setSubmitError("Form submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="col-span-7 col-start-6 row-span-2 flex flex-col justify-between"
      aria-label="Contact form or additional information"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-1 flex-col">
        <ContactInput placeholder="Name" {...register("name")} />
        <ContactInput placeholder="Company" {...register("company")} />
        <ContactInput
          placeholder="Email"
          type="email"
          errors={errors}
          {...register("email", { required: "Email is required" })}
        />
        <ContactInput
          placeholder="Budget (optional)"
          errors={errors}
          {...register("budget")}
        />
        <ContactInput
          className="flex-1"
          placeholder="Message"
          type="textarea"
          errors={errors}
          noBorder
          {...register("message", { required: "Message is required" })}
        />
      </div>
      <div className="flex flex-col items-start justify-between gap-4 border-t border-brand-g2 xl:flex-row">
        <button type="submit" className="pt-3 xl:pt-6">
          <p className="actionable actionable-no-underline flex !h-fit items-start gap-1.5 text-brand-w1 xl:gap-3">
            <span className="text-f-h2-mobile font-semibold leading-none xl:text-[56px] xl:tracking-[-2.24px]">
              Submit Message
            </span>

            <svg
              className="size-[0.7em] xl:size-[1.5em]"
              width="31"
              height="31"
              viewBox="0 0 31 31"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M25.44 30.3124V5.61643H0.856L6.4 0.128427L30.984 0.184426V24.8244L25.44 30.3124ZM0.408 25.8324L25.664 0.520425L30.648 5.44842L5.336 30.7604L0.408 25.8324Z" />
            </svg>
          </p>
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
