import { ContactForm } from "./contact-form"
const Contact = () => {
  return (
    <div className="grid-layout h-[calc(100vh-24px)] w-full grid-cols-4 grid-rows-[auto_1fr] gap-y-6 pb-6 text-brand-w1 xl:grid-cols-12 xl:grid-rows-2">
      <h1 className="text-f-h0-mobile xl:text-f-h0 col-span-4 font-semibold xl:col-start-1 xl:col-end-6 xl:row-start-1 xl:row-end-2 xl:h-fit xl:text-[98px]">
        Contact us
      </h1>
      <div className="col-span-4 row-span-1 flex h-full flex-col gap-6 xl:col-start-7 xl:col-end-13 xl:row-start-1 xl:row-end-3">
        <ContactForm />
      </div>
      <div className="col-span-4 row-span-1 flex flex-col justify-end gap-6 xl:col-start-1 xl:col-end-4 xl:row-start-2 xl:row-end-3">
        <div className="flex w-full flex-col text-[54px] font-semibold leading-none xl:text-[56px]">
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
        <div className="flex flex-wrap items-center gap-2 text-mobile-h3 xl:text-h3">
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
