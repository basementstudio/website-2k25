"use server"

import * as Sentry from "@sentry/nextjs"

import { isValidEmail } from "@/utils/email"

// The "General" audience segment in the Resend dashboard.
const NEWSLETTER_SEGMENT_ID = "67cdd754-44a1-492e-8ed3-47dbdac70398"

type State = {
  success: boolean
  message: string
}

// The client maps any message containing "email" to its "Invalid Email" state.
const INVALID_EMAIL_STATE: State = {
  success: false,
  message: "Invalid email"
}

export async function subscribe(
  _prevState: State,
  formData: FormData
): Promise<State> {
  return Sentry.withServerActionInstrumentation("subscribe", () =>
    runSubscribe(formData)
  )
}

async function runSubscribe(formData: FormData): Promise<State> {
  try {
    const rawEmail = formData.get("email")

    if (!rawEmail) {
      throw new Error("Email is Required")
    }

    const email = typeof rawEmail === "string" ? rawEmail.trim() : ""

    // Invalid input is an expected user error: report it back to the form
    // instead of calling Resend and capturing an exception.
    if (!isValidEmail(email)) {
      return INVALID_EMAIL_STATE
    }

    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      throw new Error("Missing Resend environment variables")
    }

    const response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        segments: [{ id: NEWSLETTER_SEGMENT_ID }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      if (
        response.status === 409 ||
        /already exists/i.test(data.message ?? "")
      ) {
        return {
          success: false,
          message: "already registered"
        }
      }
      if (response.status === 422) {
        return INVALID_EMAIL_STATE
      }
      throw new Error(data.message || "Failed to subscribe")
    }

    return {
      success: true,
      message: "Successfully subscribed to the newsletter!"
    }
  } catch (error) {
    console.error("Error:", error)
    Sentry.captureException(error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred"
    }
  }
}
