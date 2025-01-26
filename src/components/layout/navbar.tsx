import { Pump } from "basehub/react-pump"

import { NavbarContent } from "./navbar-content"
import { query } from "./query"

interface NavbarLink {
  title: string
  href: string
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
          count: projects
        },
        {
          title: "Services",
          href: "/services"
        },
        {
          title: "People",
          href: "/careers"
        },
        {
          title: "Laboratory",
          href: "/lab"
        },
        {
          title: "Blog",
          href: "/blog",
          count: posts
        }
      ]

      return <NavbarContent links={LINKS} />
    }}
  </Pump>
)
