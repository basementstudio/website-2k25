"use server"

import * as Sentry from "@sentry/nextjs"

type State = {
  success: boolean
  message: string
}

export async function subscribe(
  _prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const email = formData.get("email")

    if (!email) {
      throw new Error("Email is Required")
    }

    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      throw new Error("Missing Resend environment variables")
    }

    const segmentId = process.env.RESEND_NEWSLETTER_SEGMENT_ID

    const response = await fetch("https://api.resend.com/contacts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
        ...(segmentId ? { segments: [segmentId] } : {})
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
