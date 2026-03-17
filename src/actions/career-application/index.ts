"use server"

import { type CareerApplication, submitApplication } from "@/lib/notion"

interface CareerFormData {
  firstName: string
  lastName: string
  email: string
  location: string
  motivation: string
  position: string
  skills: string[]
  yearsOfExperience: string
  portfolio: string
  availability: string
  linkedin: string
  salaryExpectations: string
}

export async function submitCareerApplication(formData: CareerFormData) {
  try {
    const applicationData: CareerApplication = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      location: formData.location,
      motivation: formData.motivation,
      position: formData.position,
      skills: formData.skills || [],
      yearsOfExperience: formData.yearsOfExperience,
      portfolio: formData.portfolio || "",
      availability: formData.availability,
      linkedin: formData.linkedin || "",
      salaryExpectations: formData.salaryExpectations || ""
    }

    const result = await submitApplication(applicationData)

    if (result.success) {
      return { success: true }
    }

    return { success: false, error: "Failed to submit application" }
  } catch (error) {
    console.error("Error submitting career application:", error)
    return { success: false, error: "Failed to submit application" }
  }
}
