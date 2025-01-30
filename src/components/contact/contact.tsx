"use client"
import { useSearchParams } from "next/navigation"

import ContactCanvas from "./contact-canvas"

const Contact = () => {
  const isContact = useSearchParams().get("contact")

  return (
    <div className="fixed inset-0 z-50">{isContact && <ContactCanvas />}</div>
  )
}

export default Contact
