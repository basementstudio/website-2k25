"use client"

import { useEffect, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { submitCareerApplication } from "@/actions/career-application"
import { ContactStatus } from "@/app/contact/form/contact-status"

import { CtaButton } from "./components/cta-button"
import { FormCheckboxGroup } from "./components/form-checkbox-group"
import { FormInput } from "./components/form-input"
import { FormRadioGroup } from "./components/form-radio-group"
import { FormTextarea } from "./components/form-textarea"

export interface FormConfig {
  firstAndLastName: boolean
  email: boolean
  location: boolean
  whyDoYouWantToJoin: boolean
  applyingToPosition: boolean
  designSkills: boolean
  yearsOfExperience: boolean
  portfolio: boolean
  availability: boolean
  linkedin: boolean
  salaryExpectation: boolean
}

type ApplicationInputs = {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  position: string[]
  designSkills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  linkedin: string
  salaryExpectations: string
}

const DESIGN_SKILLS = [
  { label: "UI Design", value: "ui-design" },
  { label: "UX Research", value: "ux-research" },
  { label: "Motion Design", value: "motion-design" },
  { label: "3D / WebGL", value: "3d-webgl" },
  { label: "Illustration", value: "illustration" },
  { label: "Brand Identity", value: "brand-identity" },
  { label: "Prototyping", value: "prototyping" },
  { label: "Design Systems", value: "design-systems" }
]

const YEARS_OPTIONS = ["0-1", "1-3", "3-5", "5-10", "10+"]

const AVAILABILITY_OPTIONS = ["Immediately", "In 2 weeks", "In a month"]

export const ApplicationForm = ({
  positionTitle,
  positionSlug,
  formConfig,
  openPositions
}: {
  positionTitle: string
  positionSlug: string
  formConfig: FormConfig
  openPositions: { label: string; value: string }[]
}) => {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ApplicationInputs>({
    defaultValues: {
      position: [positionSlug]
    }
  })

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
  }, [isSubmitted, submitError, reset])

  const onSubmit: SubmitHandler<ApplicationInputs> = async (data) => {
    setSubmitting(true)
    setIsSubmitted(false)
    setSubmitError("")

    try {
      const result = await submitCareerApplication({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        location: data.location || "",
        motivation: data.motivation,
        position: Array.isArray(data.position)
          ? data.position.join(", ")
          : data.position || positionTitle,
        designSkills: data.designSkills || [],
        yearsOfExperience: data.yearsOfExperience || "",
        portfolio: data.portfolio || "",
        availability: data.availability || "",
        linkedin: data.linkedin || "",
        salaryExpectations: data.salaryExpectations || ""
      })

      if (result.success) {
        setIsSubmitted(true)
        setSubmitError("")
        reset()
      } else {
        setIsSubmitted(false)
        setSubmitError(result.error || "Failed to submit application")
      }
    } catch {
      setIsSubmitted(false)
      setSubmitError("Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      id="apply"
      className="mt-20 flex w-full flex-col items-start lg:mt-24 lg:max-w-[846px]"
    >
      {/* Divider */}
      <div className="h-px w-full bg-brand-g2" />

      {/* Form title */}
      <div className="flex w-full flex-col gap-4 pt-12 lg:gap-6 lg:pt-20">
        <h2 className="text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2">
          Apply now
        </h2>
        <p className="text-[1rem] font-medium leading-6 text-brand-w2">
          Tell us why you&apos;d be a good fit for the {positionTitle} role.
        </p>
      </div>

      {/* Form */}
      <form
        className="flex w-full flex-col gap-8 pt-12 lg:gap-10 lg:pt-20"
        aria-label={`Application form for ${positionTitle}`}
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* First name + Last name */}
        {formConfig.firstAndLastName ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-5">
            <FormInput
              label="First name"
              required
              placeholder="Jane"
              error={errors.firstName?.message}
              registration={register("firstName", {
                required: "First name is required"
              })}
            />
            <FormInput
              label="Last name"
              required
              placeholder="Doe"
              error={errors.lastName?.message}
              registration={register("lastName", {
                required: "Last name is required"
              })}
            />
          </div>
        ) : null}

        {/* Email + Location */}
        {formConfig.email || formConfig.location ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-5">
            {formConfig.email ? (
              <FormInput
                label="Email"
                required
                type="email"
                placeholder="janedoe@email.com"
                error={errors.email?.message}
                registration={register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email format"
                  }
                })}
              />
            ) : null}
            {formConfig.location ? (
              <FormInput
                label="Where are you based?"
                required
                placeholder="Argentina"
                error={errors.location?.message}
                registration={register("location", {
                  required: "Location is required"
                })}
              />
            ) : null}
          </div>
        ) : null}

        {/* Motivation */}
        {formConfig.whyDoYouWantToJoin ? (
          <FormTextarea
            label="Why do you want to join Basement?"
            required
            placeholder="Because I want to create jaw-dropping websites"
            error={errors.motivation?.message}
            registration={register("motivation", {
              required: "This field is required"
            })}
            rows={1}
          />
        ) : null}

        {/* Position */}
        {formConfig.applyingToPosition ? (
          <FormCheckboxGroup
            label="Which position are you applying for?"
            required
            description="Choose positions"
            options={openPositions}
            defaultValues={[positionSlug]}
            registration={register("position")}
          />
        ) : null}

        {/* Design Skills */}
        {formConfig.designSkills ? (
          <FormCheckboxGroup
            label="Design skills"
            required
            description="Choose your skills"
            options={DESIGN_SKILLS}
            registration={register("designSkills")}
          />
        ) : null}

        {/* Years of experience */}
        {formConfig.yearsOfExperience ? (
          <FormRadioGroup
            label="Years of experience"
            required
            options={YEARS_OPTIONS}
            registration={register("yearsOfExperience")}
          />
        ) : null}

        {/* Portfolio */}
        {formConfig.portfolio ? (
          <FormInput
            label="Portfolio"
            required
            description="Share works you are proud of. Link us to your portfolio."
            type="url"
            placeholder="https://kickasswork.com/"
            error={errors.portfolio?.message}
            registration={register("portfolio", {
              required: "Portfolio is required"
            })}
          />
        ) : null}

        {/* Availability */}
        {formConfig.availability ? (
          <FormRadioGroup
            label="Availability to start"
            required
            options={AVAILABILITY_OPTIONS}
            registration={register("availability")}
          />
        ) : null}

        {/* LinkedIn */}
        {formConfig.linkedin ? (
          <FormInput
            label="LinkedIn"
            required
            type="url"
            placeholder="https://www.linkedin.com/in/joandoe"
            error={errors.linkedin?.message}
            registration={register("linkedin", {
              required: "LinkedIn is required"
            })}
          />
        ) : null}

        {/* Salary expectations */}
        {formConfig.salaryExpectation ? (
          <FormInput
            label="Salary expectations"
            required
            placeholder="Your answer"
            error={errors.salaryExpectations?.message}
            registration={register("salaryExpectations", {
              required: "Salary expectations is required"
            })}
          />
        ) : null}

        {/* Submit */}
        <div className="flex flex-col items-start justify-between gap-4 pb-20 pt-3 lg:flex-row lg:pb-0 lg:pt-10">
          <CtaButton disabled={submitting} />
          <ContactStatus
            isSubmitted={isSubmitted}
            error={submitError}
            isSubmitting={submitting}
          />
        </div>
      </form>
    </section>
  )
}
