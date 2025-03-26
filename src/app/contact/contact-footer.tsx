import { Pump } from "basehub/react-pump"

import { query } from "@/components/layout/query"
import { SocialLinks } from "@/components/layout/shared-sections"

export const ContactFooter = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      return (
        <footer className="col-span-4 row-start-2 mt-auto flex flex-col justify-end gap-6 xl:mt-0">
          <a
            href="mailto:hello@basement.studio"
            className="w-fit text-[30px] font-semibold not-italic leading-none tracking-[-2.16px] xl:text-[56px] xl:tracking-[-2.24px]"
          >
            <span className="actionable actionable-no-underline group !inline">
              <span className="custom-underline">hello@</span>
              <br />
              <span className="custom-underline">basement.</span>
              <br />
              <span className="custom-underline">studio</span>
            </span>
          </a>
          <SocialLinks
            links={{
              ...data.company.social,
              linkedIn: data.company.social.linkedIn || ""
            }}
            className="flex items-center gap-2 text-f-h3-mobile lg:text-f-h3"
          />
        </footer>
      )
    }}
  </Pump>
)
