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

      const projects = data.pages.showcase.projectList.items.length
      const posts = data.pages.blog.posts.items.length
      const newsletter = data.company.social.newsletter.json.content

      const LINKS: NavbarLink[] = [
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
        <NavbarContent
          key="navbar-content"
          links={LINKS}
          socialLinks={data.company.social}
          newsletter={newsletter}
        />
      )
    }}
  </Pump>
)
