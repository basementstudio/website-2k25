"use server"

import { headers } from "next/headers"

import {
  type CareerApplication,
  type CareerFormData,
  buildApplicationData,
  submitApplication
} from "@/lib/notion"

const GENERIC_SUBMISSION_ERROR =
  "There was a problem submitting your application. Please try again in a moment or contact us."
const MIN_SUBMISSION_TIME_MS = 3_000
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000
const MAX_SUBMISSIONS_PER_WINDOW = 5

const submissionAttempts = new Map<string, number[]>()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value)
}

function isValidUrl(value: string) {
  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    new URL(normalized)
    return true
  } catch {
    return false
  }
}

function getClientIdentifier(headerList: Headers, email: string) {
  const forwardedFor = headerList.get("x-forwarded-for")
  const realIp = headerList.get("x-real-ip")
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown"

  return `${ipAddress}:${email.trim().toLowerCase()}`
}

function isRateLimited(key: string, now: number) {
  const recentAttempts = (submissionAttempts.get(key) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  )

  if (recentAttempts.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    submissionAttempts.set(key, recentAttempts)
    return true
  }

  recentAttempts.push(now)
  submissionAttempts.set(key, recentAttempts)

  return false
}

function isSuspiciousSubmission(formData: CareerFormData, now: number) {
  if (formData.companyWebsite.trim()) {
    return true
  }

  if (!Number.isFinite(formData.formStartedAt)) {
    return true
  }

  return now - formData.formStartedAt < MIN_SUBMISSION_TIME_MS
}

function validateCareerFormData(formData: CareerFormData) {
  if (!formData.position.trim()) return false

  if (formData.email.trim() && !isValidEmail(formData.email)) return false
  if (formData.portfolio && !isValidUrl(formData.portfolio)) return false
  if (formData.github && !isValidUrl(formData.github)) return false
  if (formData.linkedin && !isValidUrl(formData.linkedin)) return false
  if (
    formData.salaryExpectations !== undefined &&
    !Number.isFinite(formData.salaryExpectations)
  ) {
    return false
  }

  return true
}

export async function submitCareerApplication(formData: CareerFormData) {
  try {
    const now = Date.now()

    if (isSuspiciousSubmission(formData, now)) {
      return { success: true }
    }

    console.info("[Career Form] Received submission", {
      position: formData.position,
      email: formData.email,
      skillsCount: formData.skills.length,
      hasPortfolio: Boolean(formData.portfolio),
      hasGithub: Boolean(formData.github),
      hasLinkedin: Boolean(formData.linkedin)
    })

    if (!validateCareerFormData(formData)) {
      console.error("[Career Form] Validation failed", {
        position: formData.position,
        email: formData.email,
        salaryExpectations: formData.salaryExpectations
      })
      return { success: false, error: GENERIC_SUBMISSION_ERROR }
    }

    const headerList = await headers()
    const clientIdentifier = getClientIdentifier(headerList, formData.email)

    if (isRateLimited(clientIdentifier, now)) {
      console.error("Career application rate limited:", clientIdentifier)
      return { success: false, error: GENERIC_SUBMISSION_ERROR }
    }

    const applicationData = buildApplicationData(formData)

    const result = await submitApplication(applicationData)

    if (result.success) {
      return { success: true }
    }

    console.error("[Career Form] Notion submission failed", {
      position: formData.position,
      email: formData.email,
      error: result.error
    })

    return {
      success: false,
      error: GENERIC_SUBMISSION_ERROR
    }
  } catch (error) {
    console.error("Error submitting career application:", error)
    return { success: false, error: GENERIC_SUBMISSION_ERROR }
  }
}
