import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions
} from "sanity/presentation"

export const resolve: PresentationPluginOptions["resolve"] = {
  locations: {
    homepage: defineLocations({
      locations: [{ title: "Home", href: "/" }],
      message: "This document is used on the homepage."
    }),
    servicesPage: defineLocations({
      locations: [{ title: "Services", href: "/services" }]
    }),
    peoplePage: defineLocations({
      locations: [{ title: "People", href: "/people" }]
    }),
    showcasePage: defineLocations({
      locations: [{ title: "Showcase", href: "/showcase" }]
    }),
    companyInfo: defineLocations({
      locations: [
        { title: "Home", href: "/" },
        { title: "Services", href: "/services" },
        { title: "People", href: "/people" }
      ]
    }),
    post: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || "Untitled", href: `/post/${doc?.slug}` },
          { title: "All posts", href: "/blog" }
        ]
      })
    }),
    project: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || "Untitled", href: `/showcase/${doc?.slug}` },
          { title: "Showcase", href: "/showcase" }
        ]
      })
    }),
    openPosition: defineLocations({
      select: { title: "title", slug: "slug.current" },
      resolve: (doc) => ({
        locations: [
          { title: doc?.title || "Untitled", href: `/careers/${doc?.slug}` },
          { title: "Careers", href: "/careers" }
        ]
      })
    })
  },
  mainDocuments: defineDocuments([
    { route: "/", filter: `_type == "homepage"` },
    { route: "/services", filter: `_type == "servicesPage"` },
    { route: "/people", filter: `_type == "peoplePage"` },
    { route: "/showcase", filter: `_type == "showcasePage"` },
    {
      route: "/post/:slug",
      filter: `_type == "post" && slug.current == $slug`
    },
    {
      route: "/showcase/:slug",
      filter: `_type == "project" && slug.current == $slug`
    },
    {
      route: "/careers/:slug",
      filter: `_type == "openPosition" && slug.current == $slug`
    }
  ])
}
