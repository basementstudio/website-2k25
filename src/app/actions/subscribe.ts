"use server"

export async function subscribe(formData: FormData) {
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
        status: "subscribed"
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail)
    }
  } catch (error) {
    console.error("Error:", error)
  }
}
