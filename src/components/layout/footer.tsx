import { Pump } from "basehub/react-pump"
import Link from "next/link"

import { Grid } from "@/components/grid"
import { cn } from "@/utils/cn"

import { StayConnected } from "./stay-connected"

const Logo = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 1728 270"
    className={className}
  >
    <path d="M28.8848 264V6.26991h88.5722c30.492 0 53.361 5.56599 68.607 16.69799 15.246 11.132 22.869 28.677 22.869 52.635 0 11.132-2.42 20.933-7.26 29.4031-4.84 8.47-11.737 15.125-20.691 19.965-8.954 4.598-19.602 6.897-31.944 6.897l-.363-2.178c22.022 0 39.325 5.929 51.909 17.787 12.826 11.616 19.239 26.862 19.239 45.738 0 23.474-7.623 41.14-22.869 52.998C181.708 258.071 160.049 264 131.977 264H28.8848Zm31.218-30.492h71.8742c17.666 0 31.218-3.63 40.656-10.89 9.68-7.26 14.52-17.666 14.52-31.218s-4.84-24.079-14.52-31.581c-9.438-7.744-22.99-11.616-40.656-11.616H60.1028v85.305Zm0-115.797h57.3542c18.876 0 33.396-3.509 43.56-10.527 10.164-7.2601 15.246-17.3031 15.246-30.1291 0-13.552-4.961-23.595-14.883-30.129-9.68-6.776-24.321-10.164-43.923-10.164H60.1028v80.9491ZM360.638 269.808c-19.844 0-37.147-3.751-51.909-11.253-14.762-7.502-26.499-17.787-35.211-30.855-8.47-13.31-13.431-28.677-14.883-46.101l32.67-2.178c1.694 12.826 5.445 23.716 11.253 32.67s13.552 15.73 23.232 20.328c9.922 4.598 21.78 6.897 35.574 6.897 12.1 0 22.385-1.573 30.855-4.719 8.47-3.146 14.883-7.744 19.239-13.794 4.598-6.05 6.897-13.431 6.897-22.143 0-7.986-1.936-15.004-5.808-21.054-3.63-6.292-10.769-11.979-21.417-17.061-10.406-5.324-25.894-10.527-46.464-15.609-19.844-5.082-35.695-10.648-47.553-16.698-11.616-6.05-20.086-13.431-25.41-22.143-5.082-8.7121-7.623-19.4811-7.623-32.3071 0-14.52 3.388-27.225 10.164-38.115 7.018-11.132 16.94-19.723 29.766-25.773C316.836 3.60791 332.082.461914 349.748.461914c18.876 0 35.09 3.629996 48.642 10.889986 13.552 7.018 24.321 16.698 32.307 29.04 7.986 12.342 12.947 26.378 14.883 42.108l-32.67 2.178c-1.452-10.406-4.84-19.602-10.164-27.588-5.082-8.228-12.1-14.641-21.054-19.239-8.954-4.598-19.844-6.897-32.67-6.897-15.972 0-28.677 3.872-38.115 11.616-9.438 7.502-14.157 17.424-14.157 29.766 0 7.986 1.815 14.641 5.445 19.965 3.872 5.082 10.648 9.6801 20.328 13.7941 9.68 3.872 23.595 8.107 41.745 12.705 21.538 5.324 38.599 11.737 51.183 19.239 12.826 7.26 21.901 15.73 27.225 25.41 5.566 9.68 8.349 20.691 8.349 33.033 0 15.004-3.872 28.072-11.616 39.204-7.744 10.89-18.392 19.36-31.944 25.41-13.552 5.808-29.161 8.712-46.827 8.712ZM499.296 264V6.26991h43.56L625.257 229.878 707.295 6.26991h43.56V264h-31.218V64.3499L645.948 264h-41.745L530.514 64.3499V264h-31.218Zm311.244 0V6.26991h44.286L982.239 232.782V6.26991h31.221V264h-46.467L841.758 41.8439V264H810.54Zm306.42 0V36.7619h-80.23V6.26991h191.67V36.7619h-80.22V264h-31.22Zm95.52 0v-41.019h41.02V264h-41.02Zm78.83 0c0-18.15 2.79-34.485 8.35-49.005 5.81-14.762 15.85-28.798 30.13-42.108 14.52-13.31 34.61-26.741 60.26-40.293 11.86-6.292 21.42-12.1 28.68-17.424 7.26-5.324 12.58-11.011 15.97-17.0611 3.39-6.05 5.08-13.431 5.08-22.143 0-8.954-1.94-16.698-5.81-23.232-3.87-6.776-9.68-12.1-17.42-15.972-7.5-3.872-16.94-5.808-28.32-5.808-18.15 0-32.54 4.719-43.19 14.157-10.41 9.438-16.94 22.869-19.6 40.293l-32.67-2.178c2.9-25.168 12.58-45.254 29.04-60.258C1338.26 7.96391 1360.4.461914 1388.23.461914c17.67 0 32.8 3.145996 45.38 9.437986 12.58 6.292 22.14 15.125 28.68 26.499 6.77 11.132 10.16 24.079 10.16 38.841 0 13.068-2.18 24.442-6.53 34.1221-4.36 9.438-11.74 18.271-22.15 26.499-10.16 8.228-24.2 17.061-42.1 26.499-23.24 12.342-40.9 24.805-53 37.389-11.86 12.584-18.15 23.837-18.88 33.759h142.66V264h-181.14Zm316.23 5.808c-18.15 0-33.88-3.025-47.19-9.075-13.07-6.05-23.48-14.52-31.22-25.41-7.5-10.89-11.86-23.474-13.07-37.752l32.67-2.178c1.94 14.52 8.11 25.531 18.51 33.033 10.65 7.26 24.08 10.89 40.3 10.89 18.15 0 32.55-5.082 43.19-15.246 10.65-10.406 15.98-24.684 15.98-42.834 0-12.1-2.42-22.506-7.26-31.218-4.6-8.954-11.38-15.851-20.33-20.691-8.96-4.84-19.72-7.26-32.31-7.26-11.86 0-22.63 2.541-32.31 7.623-9.68 5.082-16.57 12.221-20.69 21.417h-33.39l17.06-144.83709h144.47V36.7619h-115.79l-11.62 95.1061-5.81-5.808c3.87-7.502 8.96-13.673 15.25-18.513 6.53-5.082 13.91-8.8331 22.14-11.2531 8.47-2.662 17.3-3.993 26.5-3.993 17.18 0 32.31 3.872 45.37 11.6161 13.07 7.502 23.24 18.029 30.5 31.581 7.26 13.31 10.89 28.556 10.89 45.738s-3.88 32.549-11.62 46.101c-7.74 13.31-18.51 23.716-32.31 31.218-13.79 7.502-29.76 11.253-47.91 11.253Z" />
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
      const posts = 10

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
        <footer className="relative z-10 flex min-h-[calc(100vh-2.25rem)] flex-col justify-between bg-brand-k pb-4">
          <Grid />

          <Logo className="mx-auto max-w-full pt-4.5 text-brand-w2" />

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
