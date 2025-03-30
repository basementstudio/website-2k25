import type { Metadata } from "next"

import { ContactFooter } from "./contact-footer"
import { ContactForm } from "./form/contact-form"

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Let's unlock together the next level of possibilities! Reach out."
}

const Contact = () => (
  <div className="mx-auto flex h-full w-full max-w-[120rem] flex-col px-4 pb-6 pt-[calc(2.25rem+1px)]">
    <div className="flex flex-1 flex-col gap-5 pt-4 text-brand-w2 xl:grid xl:grid-cols-12 xl:grid-rows-2 xl:gap-4">
      <header className="col-span-4 xl:col-span-5">
        <h1 className="text-f-h1-mobile xl:text-f-h0">Contact us</h1>
      </header>
      <ContactForm />
      <ContactFooter />
    </div>
  </div>
)

export default Contact
