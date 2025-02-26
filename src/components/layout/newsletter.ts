"use server"

import { submitContactForm } from "@/actions/contact-form"

export async function submitNewsletter(formData: FormData) {
  await submitContactForm({
    email: formData.get("email") as string,
    name: "",
    company: "",
    message: "Add me to the newsletter."
  })
}
