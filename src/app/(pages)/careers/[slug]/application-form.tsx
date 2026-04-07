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
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i
const GITHUB_URL_REGEX = /^(https?:\/\/)?(www\.)?github\.com\/.+$/i
const LINKEDIN_URL_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com\/.+$/i
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
  validate: (value: string) => {
    if (!URL_REGEX.test(value.trim())) {
      return "Please enter a valid URL (e.g. example.com)"
    }
    return true
  }
})

const getGithubUrlRules = () => ({
  required: "GitHub is required",
  validate: (value: string) => {
    const trimmed = value.trim()
    if (!URL_REGEX.test(trimmed)) {
      return "Please enter a valid URL (e.g. github.com/username)"
    }
    if (!GITHUB_URL_REGEX.test(trimmed)) {
      return "Please enter a valid GitHub URL (e.g. github.com/username)"
    }
    return true
  }
})

const getLinkedinUrlRules = () => ({
  required: "LinkedIn is required",
  validate: (value: string) => {
    const trimmed = value.trim()
    if (!URL_REGEX.test(trimmed)) {
      return "Please enter a valid URL (e.g. linkedin.com/in/username)"
    }
    if (!LINKEDIN_URL_REGEX.test(trimmed)) {
      return "Please enter a valid LinkedIn URL (e.g. linkedin.com/in/username)"
    }
    return true
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
  const [formState, setFormState] = useState<
    "idle" | "submitting" | "submitted"
  >("idle")
  const [successVisible, setSuccessVisible] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const apiInFlightRef = useRef(false)
  const successRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    if (formState === "submitted") {
      const el = successRef.current
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 36
        window.scrollTo({ top, behavior: "smooth" })
      }
      const id = setTimeout(() => setSuccessVisible(true), 50)
      return () => clearTimeout(id)
    }
    setSuccessVisible(false)
  }, [formState])

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
    setSubmitError("")
    setFormState("submitting")

    // Brief spinner, then optimistic success
    await new Promise((r) => setTimeout(r, 250))
    setFormState("submitted")
    reset(getDefaultFormValues(positionSlug))

    // Fire API in background — revert on failure
    submitCareerApplication(submissionData)
      .then((result) => {
        if (!result.success) {
          setFormState("idle")
          setSubmitError(
            result.error || "Submission failed \u2014 please try again"
          )
        }
      })
      .catch(() => {
        setFormState("idle")
        setSubmitError("Submission failed \u2014 please try again")
      })
      .finally(() => {
        apiInFlightRef.current = false
      })
  }

  return (
    <section className="mt-20 flex w-full flex-col items-start lg:mt-24 lg:max-w-[846px]">
      {/* Divider */}
      <div className="h-px w-full bg-brand-g2" />

      {formState === "submitted" ? (
        <div
          className={cn(
            "pt-12 transition-opacity duration-500 lg:pt-16",
            successVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <h2
            ref={successRef}
            id="apply"
            className="pt-3 text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2"
          >
            Thanks for reaching out
          </h2>
          <p className="!text-pretty pb-20 pt-6 text-[1rem] font-medium leading-6 text-brand-w2 lg:pb-0">
            We&apos;re excited to see what you&apos;re all about.
            <br />
            We&apos;ll review your application and be in touch if it&apos;s a
            match.
          </p>
        </div>
      ) : (
        <>
          {/* Form title */}
          <div className="pt-12 lg:pt-16">
            <h2
              id="apply"
              className="pt-3 text-f-h2-mobile font-semibold text-brand-w2 lg:text-f-h2"
            >
              Apply now
            </h2>
          </div>

          <form
            className={cn(
              "flex w-full flex-col pt-8 transition-opacity duration-300",
              formState === "submitting" && "pointer-events-none opacity-40"
            )}
            aria-label={`Application form for ${positionTitle}`}
            method="post"
            noValidate
            onSubmit={handleSubmit(onSubmit, onError)}
          >
            <p className="pb-8 text-sm leading-6 text-brand-g1">
              * All fields are required unless stated otherwise
            </p>
            <div className="flex w-full flex-col gap-4 lg:gap-6">
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
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
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
                    "grid grid-cols-1 gap-4 lg:gap-5",
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
                  className="max-[400px]:h-14"
                />
              ) : null}

              {/* Years of experience + Salary expectations */}
              {showYearsOfExperienceField || showSalaryExpectationsField ? (
                <div
                  className={cn(
                    "grid grid-cols-1 gap-4 lg:gap-5",
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
                      "grid grid-cols-1 gap-4 lg:gap-5",
                      showPortfolioField && "lg:grid-cols-2"
                    )}
                  >
                    {showPortfolioField ? (
                      <FormInput
                        label="Portfolio"
                        required
                        type="text"
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
                      type="text"
                      placeholder="https://github.com/janedoe"
                      error={errors.github?.message}
                      registration={register("github", getGithubUrlRules())}
                    />
                  </div>
                  {showLinkedinField ? (
                    <FormInput
                      label="LinkedIn"
                      required
                      type="text"
                      placeholder="https://linkedin.com/in/joandoe"
                      error={errors.linkedin?.message}
                      registration={register("linkedin", getLinkedinUrlRules())}
                    />
                  ) : null}
                </>
              ) : showPortfolioField || showLinkedinField ? (
                <div
                  className={cn(
                    "grid grid-cols-1 gap-4 lg:gap-5",
                    showPortfolioField && showLinkedinField && "lg:grid-cols-2"
                  )}
                >
                  {showPortfolioField ? (
                    <FormInput
                      label="Portfolio"
                      required
                      type="text"
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
                      type="text"
                      placeholder="https://linkedin.com/in/joandoe"
                      error={errors.linkedin?.message}
                      registration={register("linkedin", getLinkedinUrlRules())}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* Submit area */}
            <div className="flex flex-col items-start justify-between gap-4 pb-20 pt-8 lg:flex-row lg:pb-0 lg:pt-12">
              {formState === "submitting" ? (
                <div className="flex items-center gap-3">
                  <div className="size-5 animate-spin rounded-full border-2 border-brand-w2/20 border-t-brand-w2" />
                  <span className="text-[1.125rem] font-semibold leading-[1.25rem] tracking-[-0.02em] text-brand-w2">
                    Submitting...
                  </span>
                </div>
              ) : (
                <CtaButton disabled={!isValid} />
              )}
              <ContactStatus error={submitError} />
            </div>
          </form>
        </>
      )}
    </section>
  )
}
