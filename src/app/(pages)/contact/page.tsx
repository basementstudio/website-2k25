import { ContactFooter } from "./contact-footer"
import { ContactForm } from "./form/contact-form"

const Contact = () => {
  return (
    <div className="min-h-[calc(100vh-36px)] w-full px-4 pb-6 xl:h-[calc(100vh-36px)]">
      <div className="flex h-full flex-col justify-between gap-10 text-brand-w2 xl:grid xl:grid-cols-12 xl:grid-rows-2 xl:gap-4">
        <header className="col-span-4 xl:col-span-5">
          <h1 className="text-f-h0-mobile xl:text-f-h0">Contact us</h1>
        </header>
        <ContactForm />
        <ContactFooter />
      </div>
    </div>
  )
}

export default Contact
