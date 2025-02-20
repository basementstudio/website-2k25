import { Pump } from "basehub/react-pump"

import { useContactStore } from "@/components/contact/contact-store"
import { Grid } from "@/components/grid"
import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"

import InternalLinks from "./internal-links"
import { query } from "./query"
import { StayConnected } from "./stay-connected"

const Logo = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1696 185"
    className={className}
  >
    <path d="M13.5908 22.7H158.261c47.36 0 59.2 7.585 59.2 37.555 0 21.83-13.505 31.82-45.325 33.3v1.11c35.335 2.035 50.505 12.395 50.505 34.41 0 30.34-12.95 37.925-64.38 37.925H13.5908V22.7Zm62.9 112.85h53.4652c22.57 0 28.305-2.59 28.305-13.32 0-9.62-8.51-13.69-28.305-13.69H76.4908v27.01Zm0-56.61h49.7652c18.87 0 26.825-3.7 26.825-12.21 0-9.99-5.365-12.58-26.825-12.58H76.4908v24.79Zm269.6582 58.83c41.995 0 46.62-1.11 46.62-11.655 0-9.435-10.545-12.58-52.91-15.725-81.03-6.105-101.195-15.355-101.195-46.62 0-34.595 21.645-43.29 108.595-43.29 86.395 0 109.335 10.545 109.335 52.725h-63.825c0-19.24-4.625-21.275-45.51-21.275-39.405 0-43.845 1.295-43.845 12.21 0 8.695 8.695 11.285 43.105 13.32 88.8 4.81 111 14.985 111 50.69 0 32.93-22.015 41.07-110.26 41.07s-111.74-10.175-111.74-50.69h63.825c0 17.39 4.625 19.24 46.805 19.24ZM532.444 167h-61.05V22.7l105.635.37 36.445 97.495h1.48L651.029 22.7h97.865V167h-62.9V64.325h-1.11L647.144 167h-75.48L534.109 66.545h-1.665V167Zm234.877 0V22.7h58.275l88.8 76.59h1.11l-.185-76.59h62.9V167h-55.87l-91.02-78.255h-1.11V167h-62.9Zm288.829 0V56h-67.71V22.7h198.69V56h-68.08v111h-62.9Zm141.15-37h55.5v37h-55.5v-37Zm258.7 37h-180.74v-40.7l82.69-33.3c33.67-13.505 37-19.24 37-28.49 0-11.1-2.96-12.58-30.15-12.58-26.64 0-29.6 2.035-29.6 20.35h-64.75c0-41.81 18.87-51.8 94.53-51.8 76.41 0 95.46 7.4 95.46 37 0 23.31-7.77 32.93-48.1 48.47l-72.15 27.75H1456V167Zm222.78-144.3V56h-137.83l-2.59 36.26h1.3c3.88-19.61 17.02-24.605 65.49-24.605 64.75 0 80.84 9.62 80.84 48.1v4.995c0 38.85-20.35 48.47-105.63 48.47-85.47 0-106.93-9.065-106.93-45.325h61.05c-.93 12.58 3.7 13.875 46.25 13.875 36.44 0 40.51-1.85 40.51-19.425s-4.25-19.61-42.73-19.61c-36.08 0-40.33 1.11-42.74 10.36h-61.42l5.55-86.395h198.88Z" />
  </svg>
)

export const Footer = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      const projects = data.pages.showcase.projectList.items.length
      const posts = data.pages.blog.posts.items.length

      const LINKS = [
        {
          title: "Home",
          href: "/"
        },
        {
          title: "Services",
          href: "/services"
        },
        {
          title: "Showcase",
          href: "/showcase",
          count: projects
        },
        {
          title: "People",
          href: "/people",
          count: posts
        },
        {
          title: "Blog",
          href: "/blog"
        },
        {
          title: "Laboratory",
          href: "/lab"
        }
      ]

      return (
        <footer className="relative z-10 flex h-screen flex-col justify-between bg-brand-k pb-4">
          <Grid />

          <div className="grid-layout mt-9">
            <Logo className="col-span-12 mx-auto text-brand-w2" />
          </div>

          <div className="grid-layout relative items-end">
            <StayConnected
              className="col-start-1 col-end-5"
              content={data.company.social.newsletter.json.content}
            />

            <InternalLinks className="col-start-7 col-end-9" links={LINKS} />

            <SoDa className="col-start-9 col-end-11" />

            <div className="col-start-11 col-end-13 flex translate-y-[3px] flex-col items-end gap-y-2">
              <SocialLinks links={data.company.social} />

              <Copyright />
            </div>
          </div>
        </footer>
      )
    }}
  </Pump>
)

interface SocialLinksProps {
  className?: string
  links: { twitter: string; instagram: string; github: string }
}

const SocialLinks = ({ className, links }: SocialLinksProps) => (
  <div className={cn("flex gap-x-1 !text-p text-brand-g1", className)}>
    <Link
      className="actionable text-brand-w1"
      href={links.twitter}
      target="_blank"
    >
      X (Twitter)
    </Link>
    <span>,</span>
    <Link
      className="actionable text-brand-w1"
      href={links.instagram}
      target="_blank"
    >
      Instagram
    </Link>
    <span>,</span>
    <Link
      className="actionable text-brand-w1"
      href={links.github}
      target="_blank"
    >
      GitHub
    </Link>
  </div>
)

const Copyright = ({ className }: { className?: string }) => (
  <p className={cn("text-right !text-p text-brand-g1", className)}>
    © basement.studio LLC {new Date().getFullYear()} all rights reserved
  </p>
)

const SoDa = ({ className }: { className?: string }) => (
  <div
    className={cn("flex w-full translate-y-2 items-center gap-2", className)}
  >
    <Link
      className={cn(
        "text-right !text-p font-semibold text-brand-w1",
        className
      )}
      href="https://www.sodaspeaks.com/"
    >
      Proud Member of SoDA
    </Link>

    <SodaLogo className="size-6 text-brand-w1" />
  </div>
)

const SodaLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 21 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path className="fill-brand-w1" d="M0 0h20.727v24H0z" />
    <path
      className="fill-brand-k"
      d="M2.889 17.133q.002-2.115-.004-4.229c0-.115.034-.146.16-.145.997.005 1.994-.002 2.992.004.496.003.99.044 1.477.139 1.234.24 1.993.925 2.32 2.025.187.635.247 1.283.258 1.937.012.762-.014 1.522-.196 2.27-.07.287-.169.565-.307.831-.353.683-.944 1.106-1.729 1.319-.632.17-1.282.21-1.936.211-.96.002-1.921-.002-2.882.003-.131.001-.156-.038-.156-.148q.004-2.108.003-4.217m2.025.025q0 1.305-.002 2.61c0 .089.012.137.133.133.436-.012.872.01 1.308-.014.84-.047 1.285-.37 1.51-1.108q.025-.084.046-.17c.103-.432.128-.87.133-1.31.006-.585-.008-1.17-.164-1.743-.17-.621-.577-1.002-1.295-1.08-.503-.055-1.009-.024-1.513-.038-.133-.004-.16.038-.159.149.005.857.003 1.714.003 2.571M14.182 12.704c.313 0 .625.005.937-.003.111-.002.156.027.19.126q.848 2.505 1.7 5.008.6 1.76 1.198 3.521c.048.139.047.14-.115.14-.593 0-1.186-.003-1.778.002-.108.001-.152-.032-.18-.124-.116-.374-.244-.745-.359-1.12-.027-.087-.066-.117-.168-.117q-1.455.006-2.909 0c-.105 0-.153.027-.18.121-.113.375-.237.747-.349 1.123-.026.09-.069.117-.17.117a102 102 0 0 0-1.75 0c-.133.002-.138-.036-.104-.135q1.097-3.215 2.19-6.432.361-1.052.715-2.108c.03-.093.075-.124.18-.121.318.006.635.002.952.002m-.022 2.51c-.02.033-.028.043-.032.055q-.53 1.575-1.062 3.15c-.032.094.005.103.092.103.648-.002 1.295-.005 1.942.001.129.001.141-.03.107-.132-.207-.615-.407-1.233-.61-1.849-.142-.435-.287-.87-.437-1.327M6.08 11.264c-.956-.014-1.897-.105-2.792-.442a5 5 0 0 1-.638-.296c-.066-.037-.076-.067-.032-.128q.459-.626.909-1.257c.05-.07.088-.059.154-.025.901.463 1.87.63 2.895.55a1.6 1.6 0 0 0 .643-.173c.173-.095.298-.228.34-.409.138-.597-.044-.963-.563-1.18-.503-.21-1.037-.338-1.56-.495-.486-.147-.959-.316-1.387-.576C3.384 6.43 3.047 5.859 3 5.14c-.03-.468.006-.929.205-1.368.324-.716.944-1.11 1.738-1.308.541-.134 1.095-.162 1.653-.145.781.022 1.547.121 2.275.393.119.044.29.06.335.152.043.086-.085.198-.139.298-.213.389-.434.774-.644 1.165-.049.09-.091.094-.187.056a5 5 0 0 0-2.522-.29 1.2 1.2 0 0 0-.366.106.61.61 0 0 0-.367.458c-.08.434.074.716.51.914.388.176.806.28 1.215.404.488.149.97.31 1.437.51.9.389 1.372 1.028 1.413 1.935.019.429.008.853-.146 1.264-.274.73-.858 1.157-1.642 1.384-.55.159-1.116.197-1.688.195M17.405 7.81c.002.54-.033 1.078-.176 1.606-.265.974-.925 1.573-2.017 1.761a5.8 5.8 0 0 1-2.108-.014c-1.047-.206-1.7-.8-1.954-1.737a6.16 6.16 0 0 1-.004-3.243c.26-.973.955-1.558 2.041-1.743a5.7 5.7 0 0 1 2.16.034c.935.202 1.538.73 1.823 1.562.198.578.238 1.174.235 1.774m-4.467.036c0 .171-.005.343.002.514q.01.2.044.398c.095.616.418.915 1.068.95.82.042 1.218-.242 1.336-.957.068-.407.056-.817.05-1.226-.006-.293-.029-.584-.128-.866-.117-.336-.362-.543-.745-.612a2.4 2.4 0 0 0-.562-.023c-.521.028-.834.258-.968.714-.107.364-.106.736-.097 1.108"
    />
  </svg>
)
