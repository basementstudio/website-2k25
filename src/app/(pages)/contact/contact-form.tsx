"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { submitContactForm } from "@/actions/contact-form"
import { ContactStatusHandler } from "./contact-status-handler"

const contactFormSchema = z.object({
  name: z.string().optional(),
  company: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  budget: z.string().optional(),
  message: z.string().min(1, "Message is required")
})

type ContactFormValues = z.infer<typeof contactFormSchema>

export const ContactForm = () => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema)
  })

  const onSubmit = async (data: ContactFormValues) => {
    setSubmitting(true)
    try {
      const formData = {
        ...data,
        name: data.name || "",
        company: data.company || ""
      }

      const result = await submitContactForm(formData)

      if (result.success) {
        setIsSubmitted(true)
        reset()
      }
    } catch (error) {
      setCustomError("Failed to submit form. Try again later")
    }
  }

  return (
    <form
      className="flex h-full flex-col justify-between gap-6"
      aria-label="Contact form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col gap-3 pt-4">
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Name"
            {...register("name")}
            className="remove-focus-styles w-full bg-transparent text-f-h1-mobile font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 xl:text-[56px]"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <label htmlFor="company" className="sr-only">
            Company
          </label>
          <input
            id="company"
            type="text"
            placeholder="Company"
            {...register("company")}
            className="remove-focus-styles w-full bg-transparent text-f-h1-mobile font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 xl:text-[56px]"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="relative flex flex-col gap-3 pt-4">
          {errors.email && (
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[#F32D2D33]" />
          )}
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email "
            {...register("email")}
            className="remove-focus-styles w-full bg-transparent text-f-h1-mobile font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 xl:text-[56px]"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="flex flex-col gap-3 pt-4">
          <label htmlFor="budget" className="sr-only">
            Budget (optional)
          </label>
          <input
            id="budget"
            type="text"
            placeholder="Budget (optional)"
            {...register("budget")}
            className="remove-focus-styles w-full bg-transparent text-f-h1-mobile font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 xl:text-[56px]"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="relative flex-1 pt-4">
          {errors.message && (
            <div className="pointer-events-none absolute left-0 top-0 h-full w-full bg-[#F32D2D33]" />
          )}
          <label htmlFor="message" className="sr-only">
            Message
          </label>
          <textarea
            id="message"
            placeholder="Message"
            {...register("message")}
            className="remove-focus-styles h-full w-full resize-none border-b border-b-brand-g2 bg-transparent text-f-h1-mobile font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 xl:text-[56px]"
          />
        </div>
      </div>
      <div className="flex w-full items-start justify-between">
        <button
          type="submit"
          className="remove-focus-styles flex items-center gap-2 bg-transparent text-left text-f-h1-mobile font-semibold leading-none text-brand-g2 placeholder:text-brand-g2 xl:text-[56px]"
          aria-label="Submit contact form"
        >
          Submit Message{" "}
          <span aria-hidden="true">
            <svg
              width="31"
              height="31"
              viewBox="0 0 31 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M25.44 30.3125V5.61649H0.856L6.4 0.128488L30.984 0.184487V24.8245L25.44 30.3125ZM0.408 25.8325L25.664 0.520486L30.648 5.44849L5.336 30.7605L0.408 25.8325Z"
                fill="#2E2E2E"
              />
            </svg>
          </span>
        </button>
        <ContactStatusHandler
          isSubmitted={isSubmitted}
          errors={errors}
          customError={customError}
          isSubmitting={submitting}
        />
      </div>
    </form>
  )
}
