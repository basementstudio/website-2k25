"use server"

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

    const mailchimpApiKey = process.env.MAILCHIMP_API_KEY
    const mailchimpServer = process.env.MAILCHIMP_API_SERVER
    const mailchimpAudience = process.env.MAILCHIMP_LIST_ID

    if (!mailchimpApiKey || !mailchimpServer || !mailchimpAudience) {
      throw new Error("Missing Mailchimp environment variables")
    }

    const url = `https://${mailchimpServer}.api.mailchimp.com/3.0/lists/${mailchimpAudience}/members`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`anystring:${mailchimpApiKey}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        tags: ["Newsletter"]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      // Check for specific Mailchimp error types
      if (data.title === "Member Exists") {
        return {
          success: false,
          message: "already registered"
        }
      }
      throw new Error(data.detail || "Failed to subscribe")
    }

    return {
      success: true,
      message: "Successfully subscribed to the newsletter!"
    }
  } catch (error) {
    console.error("Error:", error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred"
    }
  }
}
