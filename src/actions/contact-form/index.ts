"use server"

import { generateEmailTemplate } from "./template"

interface ContactFormData {
  name: string
  company: string
  email: string
  budget?: string
  message: string
}

export async function submitContactForm(formData: ContactFormData) {
  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: "hello@basement.studio",
        to: ["tomas@basement.studio"],
        subject: `${formData.name} - ${formData.company} | Contact Us <basement.studio>`,
        html: generateEmailTemplate(formData)
      })
    })

    if (!resendRes.ok) {
      throw new Error("Failed to send email")
    }

    return { success: true }
  } catch (error) {
    console.error("Error submitting form:", error)
    return { success: false, error: "Failed to submit form" }
  }
}
