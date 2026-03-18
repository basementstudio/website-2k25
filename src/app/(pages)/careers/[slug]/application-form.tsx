"use client"

import { useEffect, useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"

import { submitCareerApplication } from "@/actions/career-application"
import { ContactStatus } from "@/app/contact/form/contact-status"

import { CtaButton } from "./components/cta-button"
import { FormCheckboxGroup } from "./components/form-checkbox-group"
import { FormInput } from "./components/form-input"
import { FormRadioGroup } from "./components/form-radio-group"
import { FormTextarea } from "./components/form-textarea"

export interface FormConfig {
  formFields: string[]
  skills: { _title: string; _slug: string }[]
}

type ApplicationInputs = {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  position: string[]
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  github: string
  linkedin: string
  salaryExpectations: string
  companyWebsite: string
  formStartedAt: number
}

const YEARS_OPTIONS = ["0-1", "1-3", "3-5", "5-10", "10+"]

const AVAILABILITY_OPTIONS = ["Immediately", "In 2 weeks", "In a month"]

function getDefaultFormValues(positionSlug: string): ApplicationInputs {
  return {
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    motivation: "",
    position: [positionSlug],
    skills: [],
    yearsOfExperience: "",
    portfolio: "",
    availability: "",
    github: "",
    linkedin: "",
    salaryExpectations: "",
    companyWebsite: "",
    formStartedAt: Date.now()
  }
}

export const ApplicationForm = ({
  positionTitle,
  positionSlug,
  positionType,
  formConfig,
  openPositions
}: {
  positionTitle: string
  positionSlug: string
  positionType: string
  formConfig: FormConfig
  openPositions: { label: string; value: string }[]
}) => {
  const hasField = (name: string) => formConfig.formFields.includes(name)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const apiInFlightRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<ApplicationInputs>({
    defaultValues: getDefaultFormValues(positionSlug)
  })

  useEffect(() => {
    setValue("formStartedAt", Date.now())
  }, [setValue])

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setIsSubmitted(false)
    }
  }, [errors])

  // Independent 4s auto-dismiss for success state
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isSubmitted])

  // Independent 4s auto-dismiss for error state
  useEffect(() => {
    if (submitError) {
      const timer = setTimeout(() => {
        setSubmitError("")
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [submitError])

  const onSubmit: SubmitHandler<ApplicationInputs> = (data) => {
    // Guard: prevent double-submission
    if (apiInFlightRef.current) return

    const submissionData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      location: data.location || "",
      motivation: data.motivation,
      tags: positionType,
      position: positionTitle,
      skills: data.skills || [],
      yearsOfExperience: data.yearsOfExperience || "",
      portfolio: data.portfolio || "",
      availability: data.availability || "",
      github: data.github || "",
      linkedin: data.linkedin || "",
      salaryExpectations:
        data.salaryExpectations.trim() === ""
          ? undefined
          : Number(data.salaryExpectations),
      companyWebsite: data.companyWebsite || "",
      formStartedAt: data.formStartedAt || 0
    }

    // OPTIMISTIC: show success and clear form immediately
    setIsSubmitted(true)
    setSubmitError("")
    reset(getDefaultFormValues(positionSlug))

    // BACKGROUND: fire-and-forget server action
    apiInFlightRef.current = true
    setSubmitDisabled(true)

    submitCareerApplication(submissionData)
      .then((result) => {
        if (!result.success) {
          setIsSubmitted(false)
          setSubmitError(
            result.error || "Submission failed \u2014 please try again"
          )
        }
        // If success: no state change needed — already showing success
      })
      .catch(() => {
        setIsSubmitted(false)
        setSubmitError("Submission failed \u2014 please try again")
      })
      .finally(() => {
        apiInFlightRef.current = false
        setSubmitDisabled(false)
      })
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
        method="post"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="hidden" aria-hidden="true">
          <label htmlFor="companyWebsite">Company website</label>
          <input
            id="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...register("companyWebsite")}
          />
        </div>
        <input
          type="hidden"
          {...register("formStartedAt", { valueAsNumber: true })}
        />

        {/* First name + Last name */}
        {hasField("First and last name") ? (
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
        {hasField("Email") || hasField("Location") ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-5">
            {hasField("Email") ? (
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
            {hasField("Location") ? (
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
        {hasField("Why do you want to join") ? (
          <FormTextarea
            label="Why do you want to join Basement?"
            required
            placeholder="Because I want to create jaw-dropping websites"
            error={errors.motivation?.message}
            registration={register("motivation", {
              required: "This field is required"
            })}
            rows={1}
            maxLength={1500}
          />
        ) : null}

        {/* Skills */}
        {hasField("Skills") && formConfig.skills.length > 0 ? (
          <FormCheckboxGroup
            label="Skills"
            required
            description="Choose your skills"
            options={formConfig.skills.map((skill) => ({
              label: skill._title,
              value: skill._title
            }))}
            error={errors.skills?.message}
            registration={register("skills", {
              validate: (value) =>
                value?.length > 0 || "Choose at least one skill"
            })}
          />
        ) : null}

        {/* Years of experience */}
        {hasField("Years of experience") ? (
          <FormRadioGroup
            label="Years of experience"
            required
            options={YEARS_OPTIONS}
            error={errors.yearsOfExperience?.message}
            registration={register("yearsOfExperience", {
              required: "Years of experience is required"
            })}
          />
        ) : null}

        {/* Portfolio */}
        {hasField("Portfolio") ? (
          <FormInput
            label="Portfolio"
            description="Share works you are proud of. Link us to your portfolio."
            type="url"
            placeholder="https://kickasswork.com/"
            error={errors.portfolio?.message}
            registration={register("portfolio")}
          />
        ) : null}

        {/* Availability */}
        {hasField("Availability") ? (
          <FormRadioGroup
            label="Availability to start"
            required
            options={AVAILABILITY_OPTIONS}
            error={errors.availability?.message}
            registration={register("availability", {
              required: "Availability is required"
            })}
          />
        ) : null}

        {/* GitHub */}
        {hasField("Github") ? (
          <FormInput
            label="GitHub"
            required
            type="url"
            placeholder="https://github.com/janedoe"
            error={errors.github?.message}
            registration={register("github", {
              required: "GitHub is required"
            })}
          />
        ) : null}

        {/* LinkedIn */}
        {hasField("Linkedin") ? (
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
        {hasField("Salary Expectation") ? (
          <FormInput
            label="Salary expectations"
            required
            type="number"
            error={errors.salaryExpectations?.message}
            registration={register("salaryExpectations", {
              required: "Salary expectations is required",
              validate: (value) =>
                value.trim() !== "" && Number.isFinite(Number(value))
                  ? true
                  : "Salary expectations is required"
            })}
          />
        ) : null}

        {/* Submit */}
        <div className="flex flex-col items-start justify-between gap-4 pb-20 pt-3 lg:flex-row lg:pb-0 lg:pt-10">
          <CtaButton disabled={submitDisabled} />
          <ContactStatus isSubmitted={isSubmitted} error={submitError} />
        </div>
      </form>
    </section>
  )
}
