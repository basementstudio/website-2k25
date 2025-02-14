"use server"

interface ContactFormData {
  name: string
  company: string
  email: string
  budget?: string
  message: string
}

export async function submitContactForm(formData: ContactFormData) {
  try {
    console.log("Form submitted:", formData)

    return { success: true }
  } catch (error) {
    console.error("Error submitting form:", error)
    return { success: false, error: "Failed to submit form" }
  }
}
