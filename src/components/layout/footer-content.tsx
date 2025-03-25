import { cn } from "@/utils/cn"

import type { QueryType } from "./query"
import { Copyright, InternalLinks, SocialLinks, SoDa } from "./shared-sections"
import { StayConnected } from "./stay-connected"

const Logo = ({ className }: { className?: string }) => (
  <>
    <svg
      viewBox="0 0 356 46"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn("block lg:hidden", className)}
    >
      <title>basement.studio</title>
      <path d="M0.870091 1.37606H44.6059C58.9235 1.37606 62.5029 3.66911 62.5029 12.7295C62.5029 19.329 58.4201 22.3491 48.8005 22.7965V23.1321C59.4828 23.7473 64.0689 26.8793 64.0689 33.5347C64.0689 42.7069 60.1539 45 44.6059 45H0.870091V1.37606ZM19.8857 35.4922H36.0489C42.8721 35.4922 44.6059 34.7092 44.6059 31.4654C44.6059 28.5571 42.0332 27.3267 36.0489 27.3267H19.8857V35.4922ZM19.8857 18.3782H34.9303C40.635 18.3782 43.0399 17.2596 43.0399 14.687C43.0399 11.6668 41.418 10.8838 34.9303 10.8838H19.8857V18.3782ZM101.407 36.1634C114.103 36.1634 115.501 35.8278 115.501 32.6399C115.501 29.7875 112.313 28.8368 99.5055 27.886C75.0089 26.0404 68.9128 23.244 68.9128 13.7921C68.9128 3.33354 75.4564 0.70492 101.743 0.70492C127.861 0.70492 134.796 3.89283 134.796 16.6444H115.501C115.501 10.8279 114.103 10.2127 101.743 10.2127C89.8299 10.2127 88.4876 10.6042 88.4876 13.904C88.4876 16.5326 91.1162 17.3156 101.519 17.9308C128.364 19.3849 135.076 22.461 135.076 33.2551C135.076 43.2103 128.42 45.6711 101.743 45.6711C75.0649 45.6711 67.962 42.5951 67.962 30.3468H87.2572C87.2572 35.6041 88.6554 36.1634 101.407 36.1634ZM157.727 45H139.27V1.37606L171.205 1.48791L182.223 30.962H182.671L193.577 1.37606H223.163V45H204.147V13.9599H203.811L192.402 45H169.583L158.23 14.631H157.727V45ZM228.734 45V1.37606H246.351L273.196 24.5303H273.532L273.476 1.37606H292.492V45H275.601L248.085 21.3424H247.749V45H228.734ZM316.05 45V11.4431H295.581V1.37606H355.648V11.4431H335.066V45H316.05Z" />
    </svg>

    <svg
      className={cn("hidden lg:block", className)}
      fill="currentColor"
      viewBox="0 0 1673 150"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>basement.studio</title>
      <path d="M1665.78 2.7V36h-137.83l-2.59 36.26h1.3c3.88-19.61 17.02-24.605 65.49-24.605 64.75 0 80.84 9.62 80.84 48.1v4.995c0 38.85-20.35 48.47-105.63 48.47-85.47 0-106.93-9.065-106.93-45.325h61.05c-.93 12.58 3.7 13.875 46.25 13.875 36.44 0 40.51-1.85 40.51-19.425s-4.25-19.61-42.73-19.61c-36.08 0-40.33 1.11-42.74 10.36h-61.42L1466.9 2.7h198.88ZM1443 147h-180.74v-40.7l82.69-33.3c33.67-13.505 37-19.24 37-28.49 0-11.1-2.96-12.58-30.15-12.58-26.64 0-29.6 2.035-29.6 20.35h-64.75c0-41.81 18.87-51.800012 94.53-51.800012 76.41 0 95.46 7.400002 95.46 37.000012 0 23.31-7.77 32.93-48.1 48.47l-72.15 27.75H1443V147ZM1184.3 110h55.5v37h-55.5v-37ZM1043.15 147V36h-67.71V2.7h198.69V36h-68.08v111h-62.9ZM754.321 147V2.7h58.275l88.8 76.59h1.11l-.185-76.59h62.9V147h-55.87l-91.02-78.255h-1.11V147h-62.9ZM519.444 147h-61.05V2.7l105.635.36999 36.445 97.49501h1.48L638.029 2.7h97.865V147h-62.9V44.325h-1.11L634.144 147h-75.48L521.109 46.545h-1.665V147ZM333.149 117.77c41.995 0 46.62-1.11 46.62-11.655 0-9.435-10.545-12.58-52.91-15.725-81.03-6.105-101.195-15.355-101.195-46.62 0-34.59501 21.645-43.290012 108.595-43.290012 86.395 0 109.335 10.545012 109.335 52.725012h-63.825c0-19.24-4.625-21.275-45.51-21.275-39.405 0-43.845 1.295-43.845 12.21 0 8.695 8.695 11.285 43.105 13.32 88.8 4.81 111 14.985 111 50.69 0 32.93-22.015 41.07-110.26 41.07s-111.74-10.175-111.74-50.69h63.825c0 17.39 4.625 19.24 46.805 19.24ZM.59082 2.7H145.261c47.36 0 59.2 7.585 59.2 37.555 0 21.83-13.505 31.82-45.325 33.3v1.11c35.335 2.035 50.505 12.395 50.505 34.41 0 30.34-12.95 37.925-64.38 37.925H.59082V2.7ZM63.4908 115.55h53.4652c22.57 0 28.305-2.59 28.305-13.32 0-9.62-8.51-13.69-28.305-13.69H63.4908v27.01Zm0-56.61h49.7652c18.87 0 26.825-3.7 26.825-12.21 0-9.99-5.365-12.58-26.825-12.58H63.4908v24.79Z" />
    </svg>
  </>
)

export const FooterContent = ({ data }: { data: QueryType }) => {
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
      href: "/people"
    },
    {
      title: "Blog",
      href: "/blog",
      count: posts
    },
    {
      title: "Lab",
      href: "/lab"
    }
  ]

  return (
    <footer className="relative z-10 flex flex-col justify-between bg-brand-k pb-4 lg:h-[calc(100dvh-3.25rem)]">
      <div className="grid-layout">
        <Logo className="col-span-full mx-auto border-b border-brand-w1/30 pb-2 text-brand-w2 lg:pb-4" />
      </div>

      <div className="grid-layout relative grid-rows-[auto_auto_28px] !gap-y-10 pb-2 pt-4 lg:grid-rows-[auto] lg:items-end lg:!gap-y-2 lg:py-0">
        <InternalLinks
          className="col-start-1 col-end-5 row-start-1 border-b border-brand-w1/30 pb-4 lg:col-start-7 lg:col-end-9 lg:border-none lg:pb-0"
          links={LINKS}
          onNav={false}
        />

        <StayConnected
          className="col-start-1 col-end-5 row-start-2 hidden lg:row-auto"
          content={data.company.social.newsletter.json.content}
        />

        <div className="col-span-full row-start-3 flex flex-col justify-end gap-y-2 lg:hidden">
          <SocialLinks
            className="col-start-1 col-end-5 row-start-2 lg:hidden"
            links={{
              ...data.company.social,
              linkedIn: data.company.social.linkedIn || ""
            }}
          />
          <Copyright className="text-left" />
        </div>

        <div className="col-start-10 col-end-13 hidden translate-y-[3px] flex-col items-end gap-y-2 lg:flex">
          <SocialLinks
            links={{
              ...data.company.social,
              linkedIn: data.company.social.linkedIn || ""
            }}
          />
          <Copyright />
        </div>
      </div>
    </footer>
  )
}
