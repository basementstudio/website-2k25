export const ContactFooter = () => (
  <footer className="col-span-4 row-start-2 mt-auto flex flex-col justify-end gap-6 xl:mt-0">
    <a
      href="mailto:hello@basement.studio"
      className="w-fit text-[54px] font-semibold not-italic leading-none tracking-[-2.16px] xl:text-[56px] xl:tracking-[-2.24px]"
    >
      <span className="actionable actionable-no-underline group !inline">
        <span className="custom-underline">hello@</span>
        <br />
        <span className="custom-underline">basement.</span>
        <br />
        <span className="custom-underline">studio</span>
      </span>
    </a>
    <nav
      className="flex items-center gap-2 text-f-h3-mobile lg:text-f-h3"
      aria-label="Social media links"
    >
      <a href="https://twitter.com/basementstudio" title="Twitter">
        x (twitter)
      </a>
      <span className="text-brand-g1">,</span>
      <a href="https://www.instagram.com/basementdotstudio" title="Instagram">
        instagram
      </a>
      <span className="text-brand-g1">,</span>
      <a href="https://github.com/basementstudio" title="GitHub">
        github
      </a>
    </nav>
  </footer>
)
