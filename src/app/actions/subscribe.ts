"use server"

type State = {
  success: boolean
  message: string
}

export async function subscribe(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const email = formData.get("email")

    if (!email) {
      throw new Error("Email is required")
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

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail)
    }
    return {
      success: true,
      message: "Successfully subscribed to the newsletter!"
    }
  } catch (error) {
    console.error("Error:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}
