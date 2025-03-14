import { ContactForm } from "./contact-form"
const Contact = () => {
  return (
    <div className="grid-layout h-[calc(100vh-24px)] w-full grid-rows-2 pb-6 text-brand-w1">
      <div className="col-start-7 col-end-13 row-start-1 row-end-3 flex h-full flex-col gap-6">
        <ContactForm />
      </div>
      <h1 className="col-start-1 col-end-5 row-start-1 row-end-2 h-fit text-[98px] font-semibold">
        Contact us
      </h1>
      <div className="col-start-1 col-end-4 row-start-2 row-end-3 flex flex-col justify-end gap-6">
        <div className="flex w-full flex-col text-[56px] font-semibold leading-none">
          <a
            href="mailto:hello@basement.studio"
            className="text-wrap break-words hover:underline focus:outline-none focus:ring-2 focus:ring-brand-w1"
          >
            hello@
            <br />
            basement.
            <br />
            studio
          </a>
        </div>
        <div className="flex items-center gap-2 text-h3">
          <a
            href="https://twitter.com/basement"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-brand-w1"
          >
            x (twitter)
          </a>
          <span aria-hidden="true">,</span>
          <a
            href="https://instagram.com/basement"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-brand-w1"
          >
            instagram
          </a>
          <span aria-hidden="true">,</span>
          <a
            href="https://github.com/basement"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-brand-w1"
          >
            github
          </a>
        </div>
      </div>
    </div>
  )
}

export default Contact
