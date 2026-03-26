"use client"

import { useEffect, useRef, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { submitCareerApplication } from "@/actions/career-application"
import { ContactStatus } from "@/app/contact/form/contact-status"

import { CtaButton } from "./components/cta-button"
import { FormCheckboxGroup } from "./components/form-checkbox-group"
import { FormInput } from "./components/form-input"
import { FormSelect } from "./components/form-select"
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
  whyDoYouWantToJoin: string
  position: string[]
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  github: string
  availabilityToStart: string
  linkedin: string
  salaryExpectations: string
  companyWebsite: string
  formStartedAt: number
}

const YEARS_OPTIONS = ["0-1", "1-3", "3-5", "5-10", "10+"]

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_REGEX = /^https?:\/\/.+/

function getDefaultFormValues(positionSlug: string): ApplicationInputs {
  return {
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    whyDoYouWantToJoin: "",
    position: [positionSlug],
    skills: [],
    yearsOfExperience: "",
    portfolio: "",
    github: "",
    availabilityToStart: "",
    linkedin: "",
    salaryExpectations: "",
    companyWebsite: "",
    formStartedAt: 0
  }
}

export const ApplicationForm = ({
  positionTitle,
  positionSlug,
  positionType,
  formConfig
}: {
  positionTitle: string
  positionSlug: string
  positionType: string
  formConfig: FormConfig
}) => {
  const hasField = (name: string) => formConfig.formFields.includes(name)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const apiInFlightRef = useRef(false)
  const sectionRef = useRef<HTMLElement>(null)
  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    formState: { errors },
    reset
  } = useForm<ApplicationInputs>({
    defaultValues: getDefaultFormValues(positionSlug)
  })

  const registerWithBlurValidation = (
    name: keyof ApplicationInputs,
    options?: Parameters<typeof register>[1]
  ) => {
    const registration = register(name, options)
    const originalOnBlur = registration.onBlur
    return {
      ...registration,
      onBlur: async (e: { target: unknown; type?: string }) => {
        await originalOnBlur(e)
        if (e.target instanceof HTMLInputElement && e.target.value) {
          trigger(name)
        }
      }
    }
  }

  useEffect(() => {
    setValue("formStartedAt", Date.now())
  }, [setValue])

  const onError = () => {
    const firstErrorKey = Object.keys(errors)[0]
    if (!firstErrorKey) return
    const el = document.querySelector<HTMLElement>(`[name="${firstErrorKey}"]`)
    if (!el) return
    const scrollTarget = el.closest("fieldset") ?? el.parentElement
    scrollTarget?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  const onSubmit: SubmitHandler<ApplicationInputs> = async (data) => {
    // Guard: prevent double-submission
    if (apiInFlightRef.current) return

    const submissionData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      location: data.location || "",
      whyDoYouWantToJoin: data.whyDoYouWantToJoin,
      tags: positionType,
      position: positionTitle,
      skills: data.skills || [],
      yearsOfExperience: data.yearsOfExperience || "",
      portfolio: data.portfolio || "",
      github: data.github || "",
      availabilityToStart: data.availabilityToStart || "",

      linkedin: data.linkedin || "",
      salaryExpectations:
        data.salaryExpectations.trim() === ""
          ? undefined
          : Number(data.salaryExpectations),
      companyWebsite: data.companyWebsite || "",
      formStartedAt: data.formStartedAt || 0
    }

    apiInFlightRef.current = true
    setSubmitDisabled(true)
    setSubmitError("")

    try {
      const result = await submitCareerApplication(submissionData)

      if (result.success) {
        setIsSubmitted(true)
        reset(getDefaultFormValues(positionSlug))
        requestAnimationFrame(() => {
          sectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          })
        })
      } else {
        setSubmitError(
          result.error || "Submission failed \u2014 please try again"
        )
      }
    } catch {
      setSubmitError("Submission failed \u2014 please try again")
    } finally {
      apiInFlightRef.current = false
      setSubmitDisabled(false)
    }
  }

  return (
    <section
      ref={sectionRef}
      id="apply"
      className="mt-20 flex w-full flex-col items-start lg:mt-24 lg:max-w-[846px]"
    >
      {/* Divider */}
      <div className="h-px w-full bg-brand-g2" />

      {isSubmitted ? (
        <div className="flex flex-col gap-6 pt-12 lg:pt-20">
          <h2 className="text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2">
            Thanks for reaching out
          </h2>
          <p className="text-[1rem] font-medium leading-6 text-brand-w2">
            We&apos;re excited to see what you&apos;re all about.
            <br />
            We&apos;ll review your application and be in touch if it&apos;s a
            match.
          </p>
        </div>
      ) : (
        <>
          {/* Form title */}
          <div className="pt-12 lg:pt-20">
            <h2 className="text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2">
              Apply now
            </h2>
          </div>

          {/* Form */}
          <form
            className="flex w-full flex-col gap-8 pt-8 lg:gap-10 lg:pt-12"
            aria-label={`Application form for ${positionTitle}`}
            method="post"
            noValidate
            onSubmit={handleSubmit(onSubmit, onError)}
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

            {/* Email */}
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
                    value: EMAIL_REGEX,
                    message: "Invalid email format"
                  }
                })}
              />
            ) : null}

            {/* Where are you based? */}
            {hasField("Where are you based") ? (
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

            {/* Motivation */}
            {hasField("Why do you want to join") ? (
              <FormTextarea
                label="Why do you want to join"
                required
                placeholder="Because I want to create jaw-dropping websites"
                error={errors.whyDoYouWantToJoin?.message}
                registration={register("whyDoYouWantToJoin", {
                  required: "This field is required"
                })}
                rows={1}
                maxLength={1500}
              />
            ) : null}

            {/* Years of experience */}
            {hasField("Years of experience") ? (
              <Controller
                name="yearsOfExperience"
                control={control}
                rules={{ required: "Years of experience is required" }}
                render={({ field }) => (
                  <FormSelect
                    label="Years of experience"
                    required
                    options={YEARS_OPTIONS}
                    placeholder="5-10"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.yearsOfExperience?.message}
                  />
                )}
              />
            ) : null}

            {/* Salary expectations */}
            {hasField("Salary Expectation") ? (
              <FormInput
                label="Salary expectations (USD)"
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

            {/* Skills */}
            {hasField("Skills") && formConfig.skills.length > 0 ? (
              <FormCheckboxGroup
                label="Skills"
                required
                columns={2}
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

            {/* Portfolio */}
            {hasField("Portfolio") ? (
              <FormInput
                label="Portfolio"
                required
                type="url"
                placeholder="https://kickasswork.com/"
                error={errors.portfolio?.message}
                registration={registerWithBlurValidation("portfolio", {
                  required: "Portfolio is required",
                  pattern: {
                    value: URL_REGEX,
                    message: "Please enter a valid URL (e.g. https://...)"
                  }
                })}
              />
            ) : null}

            {/* GitHub */}
            {hasField("Github") ? (
              <FormInput
                label="GitHub"
                type="url"
                placeholder="https://github.com/janedoe"
                error={errors.github?.message}
                registration={registerWithBlurValidation("github", {
                  validate: (value) =>
                    !value || (typeof value === "string" && URL_REGEX.test(value)) || "Please enter a valid URL (e.g. https://...)"
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
                registration={registerWithBlurValidation("linkedin", {
                  required: "LinkedIn is required",
                  pattern: {
                    value: URL_REGEX,
                    message: "Please enter a valid URL (e.g. https://...)"
                  }
                })}
              />
            ) : null}

            {/* Submit */}
            <div className="flex flex-col items-start justify-between gap-4 pb-20 pt-3 lg:flex-row lg:pb-0 lg:pt-10">
              <CtaButton disabled={submitDisabled} />
              <ContactStatus error={submitError} />
            </div>
          </form>
        </>
      )}
    </section>
  )
}
