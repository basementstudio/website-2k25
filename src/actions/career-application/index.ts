"use server"

import { type CareerApplication, submitApplication } from "@/lib/notion"

const GENERIC_SUBMISSION_ERROR =
  "There was a problem submitting your application. Please try again in a moment or contact us."

interface CareerFormData {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  tags: string
  position: string
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  github: string
  linkedin: string
  salaryExpectations: number
}

export async function submitCareerApplication(formData: CareerFormData) {
  try {
    const applicationData: CareerApplication = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      location: formData.location,
      motivation: formData.motivation,
      tags: formData.tags,
      position: formData.position,
      skills: formData.skills || [],
      yearsOfExperience: formData.yearsOfExperience,
      portfolio: formData.portfolio || "",
      availability: formData.availability,
      github: formData.github || "",
      linkedin: formData.linkedin || "",
      salaryExpectations: formData.salaryExpectations || 0
    }

    const result = await submitApplication(applicationData)

    if (result.success) {
      return { success: true }
    }

    console.error("Career application submission failed:", result.error)

    return {
      success: false,
      error: GENERIC_SUBMISSION_ERROR
    }
  } catch (error) {
    console.error("Error submitting career application:", error)
    return { success: false, error: GENERIC_SUBMISSION_ERROR }
  }
}
