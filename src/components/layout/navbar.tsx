import { NavbarContent } from "./navbar-content"
import { fetchCompanyInfo, fetchPostsCount, fetchProjectsCount } from "./sanity"

interface NavbarLink {
  title: string
  href: string
  count?: number
}

export const Navbar = async () => {
  const [projectsCount, postsCount, companyInfo] = await Promise.all([
    fetchProjectsCount(),
    fetchPostsCount(),
    fetchCompanyInfo()
  ])

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
      count: projectsCount
    },
    {
      title: "People",
      href: "/people"
    },
    {
      title: "Blog",
      href: "/blog",
      count: postsCount
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
      socialLinks={{
        twitter: companyInfo.twitter || "",
        instagram: companyInfo.instagram || "",
        github: companyInfo.github || "",
        linkedIn: companyInfo.linkedIn || ""
      }}
      newsletter={companyInfo.newsletter || []}
    />
  )
}
