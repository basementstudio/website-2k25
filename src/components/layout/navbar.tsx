import { Pump } from "basehub/react-pump"

import { CameraStateKeys } from "@/store/app-store"

import { NavbarContent } from "./navbar-content"
import { query } from "./query"

interface NavbarLink {
  title: string
  href: string
  routeName: CameraStateKeys
  count?: number
}

export const Navbar = () => (
  <Pump queries={[query]}>
    {async ([data]) => {
      "use server"

      const projects = data.pages.projects.projectList.items.length
      const posts = data.pages.blog.posts.items.length

      const LINKS: NavbarLink[] = [
        {
          title: "Showcase",
          href: "/showcase",
          routeName: "projects",
          count: projects
        },
        {
          title: "Services",
          href: "/services",
          routeName: "stairs"
        },

        {
          title: "People",
          href: "/people",
          routeName: "people"
        },
        {
          title: "Laboratory",
          href: "/lab",
          routeName: "lab"
        },
        {
          title: "Blog",
          href: "/blog",
          routeName: "blog",
          count: posts
        },
        {
          title: "Contact",
          href: "/contact",
          routeName: "contact"
        }
      ]

      return <NavbarContent links={LINKS} />
    }}
  </Pump>
)
