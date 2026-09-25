"use server"

import * as Sentry from "@sentry/nextjs"

import { generateEmailTemplate } from "./template"

interface ContactFormData {
  name: string
  company: string
  email: string
  budget?: string
  message: string
}

export async function submitContactForm(formData: ContactFormData) {
  return Sentry.withServerActionInstrumentation("submitContactForm", () =>
    runContactForm(formData)
  )
}

async function runContactForm(formData: ContactFormData) {
  try {
    const html = generateEmailTemplate(formData)

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "hello@basement.studio",
        to: ["sales@basement.studio"],
        subject: `${formData.name} - ${formData.company} | Contact Us <basement.studio>`,
        html
      })
    })

    if (!resendRes.ok) {
      throw new Error("Failed to send email")
    }

    return { success: true }
  } catch (error) {
    console.error("Error submitting form:", error)
    Sentry.captureException(error)
    return { success: false, error: "Failed to submit form" }
  }
}
