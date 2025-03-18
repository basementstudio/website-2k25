export const ContactFooter = () => {
  return (
    <footer className="col-span-4 row-start-2 mt-auto flex flex-col justify-end gap-6 xl:mt-0">
      <address
        className="text-[54px] font-semibold not-italic leading-none tracking-[-2.16px] underline underline-offset-8 xl:text-[56px] xl:tracking-[-2.24px]"
        aria-label="Email address"
      >
        <p>hello@</p>
        <p>basement.</p>
        <p>studio</p>
      </address>
      <nav
        className="flex items-center gap-2 text-mobile-h3 xl:text-h3"
        aria-label="Social media links"
      >
        <a href="https://twitter.com/basementstudio" title="Twitter">
          x (twitter)
        </a>
        <span className="text-brand-g1">,</span>
        <a href="https://instagram.com/basementstudio" title="Instagram">
          instagram
        </a>
        <span className="text-brand-g1">,</span>
        <a href="https://github.com/basementstudio" title="GitHub">
          github
        </a>
      </nav>
    </footer>
  )
}
