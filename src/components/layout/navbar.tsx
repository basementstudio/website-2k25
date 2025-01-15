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

export const Navbar = () => {
  return (
    <Pump queries={[query]}>
      {async ([data]) => {
        "use server"

        const projects = data.pages.projects.projectList.items.length
        const posts = data.pages.blog.posts.items.length

        const LINKS: NavbarLink[] = [
          {
            title: "Showcase",
            href: "/projects",
            routeName: "projects",
            count: projects
          },
          {
            title: "Services",
            href: "/about",
            routeName: "stairs"
          },

          {
            title: "People",
            href: "/careers",
            routeName: "careers"
          },
          {
            title: "Laboratory",
            href: "/laboratory",
            routeName: "arcade"
          },
          {
            title: "Blog",
            href: "/blog",
            routeName: "blog",
            count: posts
          },
          {
            title: "Ventures",
            href: "/ventures",
            // TODO: this will be a external link (probably)
            routeName: "home"
          }
        ]

        return <NavbarContent links={LINKS} />
      }}
    </Pump>
  )
}
