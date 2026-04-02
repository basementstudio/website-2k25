"use client"

import { type KeyboardEventHandler, useEffect, useRef, useState } from "react"
import { Controller, type SubmitHandler, useForm } from "react-hook-form"

import { submitCareerApplication } from "@/actions/career-application"
import { ContactStatus } from "@/app/contact/form/contact-status"
import { cn } from "@/utils/cn"

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
const DIGITS_ONLY_REGEX = /^\d+$/
const BLOCKED_NUMBER_KEYS = new Set(["e", "E", "+", "-", ".", ","])

const preventInvalidNumberInput: KeyboardEventHandler<HTMLInputElement> = (
  event
) => {
  if (BLOCKED_NUMBER_KEYS.has(event.key)) {
    event.preventDefault()
  }
}

const getRequiredUrlRules = (label: string) => ({
  required: `${label} is required`,
  pattern: {
    value: URL_REGEX,
    message: "Please enter a valid URL (e.g. https://...)"
  }
})

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
  const showEmailField = hasField("Email")
  const showLocationField = hasField("Where are you based")
  const showYearsOfExperienceField = hasField("Years of experience")
  const showSalaryExpectationsField = hasField("Salary Expectation")
  const showPortfolioField = hasField("Portfolio")
  const showGithubField = hasField("Github")
  const showLinkedinField = hasField("Linkedin")
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isValid },
    reset
  } = useForm<ApplicationInputs>({
    defaultValues: getDefaultFormValues(positionSlug),
    mode: "onBlur",
    reValidateMode: "onBlur"
  })

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
      id="apply"
      className="mt-20 flex w-full flex-col items-start lg:mt-24 lg:max-w-[846px]"
    >
      {/* Divider */}
      <div className="h-px w-full bg-brand-g2" />

      {/* Form title */}
      <div className="pt-12 lg:pt-20">
        <h2 className="text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2">
          Apply now
        </h2>
      </div>

      {/* Form - fields fade to 50% on submit, click anywhere to restore */}
      <form
        className="flex w-full flex-col pt-8"
        aria-label={`Application form for ${positionTitle}`}
        method="post"
        noValidate
        onSubmit={handleSubmit(onSubmit, onError)}
        onClick={() => {
          if (isSubmitted) setIsSubmitted(false)
        }}
      >
        <p className="pb-8 text-sm leading-6 text-brand-o">
          * All fields are required unless stated otherwise
        </p>
        <div
          className={cn(
            "flex w-full flex-col gap-8 transition-opacity lg:gap-10",
            isSubmitted
              ? "cursor-pointer opacity-50 duration-500"
              : "opacity-100 duration-1000"
          )}
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
          {showEmailField || showLocationField ? (
            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:gap-5",
                showEmailField && showLocationField && "lg:grid-cols-2"
              )}
            >
              {showEmailField ? (
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
              {showLocationField ? (
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

          {/* Years of experience + Salary expectations */}
          {showYearsOfExperienceField || showSalaryExpectationsField ? (
            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:gap-5",
                showYearsOfExperienceField &&
                  showSalaryExpectationsField &&
                  "lg:grid-cols-2"
              )}
            >
              {showYearsOfExperienceField ? (
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
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.yearsOfExperience?.message}
                    />
                  )}
                />
              ) : null}
              {showSalaryExpectationsField ? (
                <FormInput
                  label="Salary expectations (USD)"
                  required
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  onKeyDown={preventInvalidNumberInput}
                  error={errors.salaryExpectations?.message}
                  registration={register("salaryExpectations", {
                    required: "Salary expectations is required",
                    validate: (value) => {
                      const trimmedValue = value.trim()

                      if (trimmedValue === "") {
                        return "Salary expectations is required"
                      }

                      if (trimmedValue.startsWith("-")) {
                        return "Salary expectations can't be negative"
                      }

                      if (!DIGITS_ONLY_REGEX.test(trimmedValue)) {
                        return "Use numbers only"
                      }

                      return true
                    }
                  })}
                />
              ) : null}
            </div>
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

          {/* Portfolio, GitHub and LinkedIn */}
          {showGithubField ? (
            <>
              <div
                className={cn(
                  "grid grid-cols-1 gap-8 lg:gap-5",
                  showPortfolioField && "lg:grid-cols-2"
                )}
              >
                {showPortfolioField ? (
                  <FormInput
                    label="Portfolio"
                    required
                    type="url"
                    placeholder="https://kickasswork.com/"
                    error={errors.portfolio?.message}
                    registration={register(
                      "portfolio",
                      getRequiredUrlRules("Portfolio")
                    )}
                  />
                ) : null}
                <FormInput
                  label="GitHub"
                  required
                  type="url"
                  placeholder="https://github.com/janedoe"
                  error={errors.github?.message}
                  registration={register(
                    "github",
                    getRequiredUrlRules("GitHub")
                  )}
                />
              </div>
              {showLinkedinField ? (
                <FormInput
                  label="LinkedIn"
                  required
                  type="url"
                  placeholder="https://www.linkedin.com/in/joandoe"
                  error={errors.linkedin?.message}
                  registration={register(
                    "linkedin",
                    getRequiredUrlRules("LinkedIn")
                  )}
                />
              ) : null}
            </>
          ) : showPortfolioField || showLinkedinField ? (
            <div
              className={cn(
                "grid grid-cols-1 gap-8 lg:gap-5",
                showPortfolioField && showLinkedinField && "lg:grid-cols-2"
              )}
            >
              {showPortfolioField ? (
                <FormInput
                  label="Portfolio"
                  required
                  type="url"
                  placeholder="https://kickasswork.com/"
                  error={errors.portfolio?.message}
                  registration={register(
                    "portfolio",
                    getRequiredUrlRules("Portfolio")
                  )}
                />
              ) : null}
              {showLinkedinField ? (
                <FormInput
                  label="LinkedIn"
                  required
                  type="url"
                  placeholder="https://www.linkedin.com/in/joandoe"
                  error={errors.linkedin?.message}
                  registration={register(
                    "linkedin",
                    getRequiredUrlRules("LinkedIn")
                  )}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Submit area — not faded, always at full opacity */}
        <div className="flex flex-col items-start justify-between gap-4 pb-20 pt-16 lg:flex-row lg:pb-0 lg:pt-20">
          {/* Cross-fade between submit button and thank you message */}
          <div className="grid">
            <div
              className={cn(
                "col-start-1 row-start-1 transition-opacity duration-500",
                isSubmitted
                  ? "pointer-events-none select-none opacity-0"
                  : "opacity-100"
              )}
            >
              <CtaButton disabled={submitDisabled || !isValid} />
            </div>
            <div
              className={cn(
                "col-start-1 row-start-1 flex flex-col gap-6 transition-opacity duration-500",
                isSubmitted
                  ? "opacity-100"
                  : "pointer-events-none select-none opacity-0"
              )}
            >
              <h2 className="text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2">
                Thanks for reaching out
              </h2>
              <p className="text-[1rem] font-medium leading-6 text-brand-w2">
                We&apos;re excited to see what you&apos;re all about.
                <br />
                We&apos;ll review your application and be in touch if it&apos;s
                a match.
              </p>
            </div>
          </div>
          <ContactStatus error={submitError} />
        </div>
      </form>
    </section>
  )
}
