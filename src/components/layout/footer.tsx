import { Pump } from "basehub/react-pump"
import Link from "next/link"

import { Grid } from "@/components/grid"
import { cn } from "@/utils/cn"

import { StayConnected } from "./stay-connected"

const Logo = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1696 381"
    className={className}
  >
    <path d="M13.5908 81.7H158.261c47.36 0 59.2 7.585 59.2 37.555 0 21.83-13.505 31.82-45.325 33.3v1.11c35.335 2.035 50.505 12.395 50.505 34.41 0 30.34-12.95 37.925-64.38 37.925H13.5908V81.7Zm62.9 112.85h53.4652c22.57 0 28.305-2.59 28.305-13.32 0-9.62-8.51-13.69-28.305-13.69H76.4908v27.01Zm0-56.61h49.7652c18.87 0 26.825-3.7 26.825-12.21 0-9.99-5.365-12.58-26.825-12.58H76.4908v24.79Zm269.6582 58.83c41.995 0 46.62-1.11 46.62-11.655 0-9.435-10.545-12.58-52.91-15.725-81.03-6.105-101.195-15.355-101.195-46.62 0-34.595 21.645-43.29 108.595-43.29 86.395 0 109.335 10.545 109.335 52.725h-63.825c0-19.24-4.625-21.275-45.51-21.275-39.405 0-43.845 1.295-43.845 12.21 0 8.695 8.695 11.285 43.105 13.32 88.8 4.81 111 14.985 111 50.69 0 32.93-22.015 41.07-110.26 41.07s-111.74-10.175-111.74-50.69h63.825c0 17.39 4.625 19.24 46.805 19.24ZM532.444 226h-61.05V81.7l105.635.37 36.445 97.495h1.48L651.029 81.7h97.865V226h-62.9V123.325h-1.11L647.144 226h-75.48l-37.555-100.455h-1.665V226Zm234.877 0V81.7h58.275l88.8 76.59h1.11l-.185-76.59h62.9V226h-55.87l-91.02-78.255h-1.11V226h-62.9Zm288.829 0V115h-67.71V81.7h198.69V115h-68.08v111h-62.9Zm141.15-37h55.5v37h-55.5v-37Zm258.7 37h-180.74v-40.7l82.69-33.3c33.67-13.505 37-19.24 37-28.49 0-11.1-2.96-12.58-30.15-12.58-26.64 0-29.6 2.035-29.6 20.35h-64.75c0-41.81 18.87-51.8 94.53-51.8 76.41 0 95.46 7.4 95.46 37 0 23.31-7.77 32.93-48.1 48.47l-72.15 27.75H1456V226Zm222.78-144.3V115h-137.83l-2.59 36.26h1.3c3.88-19.61 17.02-24.605 65.49-24.605 64.75 0 80.84 9.62 80.84 48.1v4.995c0 38.85-20.35 48.47-105.63 48.47-85.47 0-106.93-9.065-106.93-45.325h61.05c-.93 12.58 3.7 13.875 46.25 13.875 36.44 0 40.51-1.85 40.51-19.425s-4.25-19.61-42.73-19.61c-36.08 0-40.33 1.11-42.74 10.36h-61.42l5.55-86.395h198.88Z" />
  </svg>
)

export const Footer = () => (
  <Pump
    queries={[
      {
        pages: {
          projects: {
            projectList: {
              items: {
                _slug: true
              }
            }
          },
          blog: {
            posts: {
              items: {
                _slug: true
              }
            }
          }
        },
        company: {
          social: {
            github: true,
            instagram: true,
            twitter: true,
            newsletter: {
              json: {
                content: true
              }
            }
          }
        }
      }
    ]}
    next={{ revalidate: 30 }}
  >
    {async ([data]) => {
      "use server"

      const projects = data.pages.projects.projectList.items.length
      const posts = data.pages.blog.posts.items.length

      const LINKS = [
        {
          title: "About Us",
          href: "/about"
        },
        {
          title: "Projects",
          href: "/projects",
          count: projects
        },
        {
          title: "Blog",
          href: "/blog",
          count: posts
        },
        {
          title: "Laboratory",
          href: "/laboratory"
        },
        {
          title: "Careers",
          href: "/careers"
        }
      ]

      return (
        <footer className="relative z-10 flex min-h-screen flex-col justify-between bg-brand-k pb-4">
          <Grid />

          <div className="grid-layout">
            <Logo className="col-span-12 mx-auto text-brand-w2" />
          </div>

          <div className="grid-layout relative items-end">
            <StayConnected
              className="col-start-1 col-end-5"
              content={data.company.social.newsletter.json.content}
            />

            <InternalLinks className="col-start-7 col-end-8" links={LINKS} />

            <SocialLinks
              className="col-start-9 col-end-11"
              links={data.company.social}
            />

            <Copyright className="col-start-11 col-end-13" />
          </div>
        </footer>
      )
    }}
  </Pump>
)

interface InternalLinksProps {
  className?: string
  links: {
    title: string
    href: string
    count?: number
  }[]
}

const InternalLinks = ({ className, links }: InternalLinksProps) => (
  <ul
    className={cn(
      "mb-1 flex flex-col gap-y-2 text-paragraph text-brand-g1",
      className
    )}
  >
    {links.map((link) => (
      <li key={link.title}>
        <Link
          className="flex gap-x-0.5 text-subheading text-brand-w1"
          href={link.href}
          target={link.href.startsWith("http") ? "_blank" : undefined}
        >
          <span className="actionable">{link.title}</span>
          {link.count && (
            <sup className="translate-y-1.25 text-paragraph !font-medium text-brand-g1">
              <span className="tabular-nums">({link.count})</span>
            </sup>
          )}
        </Link>
      </li>
    ))}
  </ul>
)
interface SocialLinksProps {
  className?: string
  links: { twitter: string; instagram: string; github: string }
}

const SocialLinks = ({ className, links }: SocialLinksProps) => (
  <div className={cn("!text-paragraph text-brand-g1", className)}>
    <Link className="actionable text-brand-w1" href={links.twitter}>
      Twitter
    </Link>
    {" , "}
    <Link className="actionable text-brand-w1" href={links.instagram}>
      Instagram
    </Link>
    {" , "}
    <Link className="actionable text-brand-w1" href={links.github}>
      Github
    </Link>
  </div>
)

const Copyright = ({ className }: { className?: string }) => (
  <p className={cn("text-right !text-paragraph text-brand-g1", className)}>
    © basement.studio LLC {new Date().getFullYear()} all rights reserved
  </p>
)
