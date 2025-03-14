export const ContactForm = () => {
  return (
    <form
      className="flex h-full flex-col justify-between gap-6"
      aria-label="Contact form"
    >
      <div className="flex h-full flex-col justify-between gap-4">
        <div className="flex flex-col gap-3">
          <label htmlFor="name" className="sr-only">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Name"
            required
            className="w-full bg-transparent text-[56px] font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="flex flex-col gap-3">
          <label htmlFor="company" className="sr-only">
            Company
          </label>
          <input
            id="company"
            type="text"
            placeholder="Company"
            className="w-full bg-transparent text-[56px] font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="flex flex-col gap-3">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-transparent text-[56px] font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <div className="flex flex-col gap-3">
          <label htmlFor="budget" className="sr-only">
            Budget (optional)
          </label>
          <input
            id="budget"
            type="text"
            placeholder="Budget (optional)"
            className="w-full bg-transparent text-[56px] font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
          />
          <div className="h-[1px] w-full bg-brand-g2" />
        </div>
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          placeholder="Message"
          required
          className="w-full flex-1 resize-none border-b border-b-brand-g2 bg-transparent text-[56px] font-semibold leading-none text-brand-w2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
        />
      </div>
      <button
        type="submit"
        className="bg-transparen flex w-full items-center gap-2 text-left text-[56px] font-semibold leading-none text-brand-g2 placeholder:text-brand-g2 focus:outline-none focus:ring-2 focus:ring-brand-w1"
        aria-label="Submit contact form"
      >
        Submit Message{" "}
        <span aria-hidden="true">
          <svg
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25.44 30.3125V5.61649H0.856L6.4 0.128488L30.984 0.184487V24.8245L25.44 30.3125ZM0.408 25.8325L25.664 0.520486L30.648 5.44849L5.336 30.7605L0.408 25.8325Z"
              fill="#2E2E2E"
            />
          </svg>
        </span>
      </button>
    </form>
  )
}
