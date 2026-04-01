import { describe, expect, test } from "bun:test"

import { generateBlogPostingSchema } from "./blog-posting"
import { generateCreativeWorkSchema } from "./creative-work"
import { generateOrganizationSchema } from "./organization"

describe("generateOrganizationSchema", () => {
  test("includes founder job titles and deduplicated awards", () => {
    const schema = generateOrganizationSchema({
      description: "Independent creative studio.",
      foundingDate: 2018,
      email: "hello@basement.studio",
      addressCity: "Buenos Aires",
      addressRegion: "Buenos Aires",
      addressCountry: "Argentina",
      logo: { url: "https://basement.studio/logo.png" },
      founders: [
        {
          name: "Nacho",
          url: "https://basement.studio/people/nacho",
          jobTitle: "Co-Founder & Managing Partner"
        }
      ],
      awards: [
        {
          title: "Awwwards Developer Award",
          date: "2024-06-01",
          projectName: "Vercel Ship"
        },
        {
          title: "Awwwards Developer Award",
          date: "2024-06-15",
          projectName: "Vercel Ship"
        },
        {
          title: "Webby Award",
          date: "2024-08-01"
        }
      ],
      social: {
        github: "https://github.com/basementstudio",
        instagram: "https://instagram.com/basementstudio",
        twitter: "https://x.com/basementstudio",
        linkedIn: "https://www.linkedin.com/company/basementstudio/"
      }
    })

    expect(schema["@id"]).toBe("https://basement.studio/#organization")
    expect(schema.founder).toEqual([
      {
        "@type": "Person",
        name: "Nacho",
        url: "https://basement.studio/people/nacho",
        jobTitle: "Co-Founder & Managing Partner"
      }
    ])
    expect(schema.award).toEqual([
      "Awwwards Developer Award - Vercel Ship 2024",
      "Webby Award 2024"
    ])
  })

  test("does not duplicate the year when the project name already ends with it", () => {
    const schema = generateOrganizationSchema({
      description: "Independent creative studio.",
      foundingDate: 2018,
      email: "hello@basement.studio",
      addressCity: "Buenos Aires",
      addressRegion: "Buenos Aires",
      addressCountry: "Argentina",
      logo: { url: "https://basement.studio/logo.png" },
      founders: [],
      awards: [
        {
          title: "FWA Site of the Day",
          date: "2025-01-01",
          projectName: "basement.studio 2025"
        }
      ],
      social: {
        github: "https://github.com/basementstudio",
        instagram: "https://instagram.com/basementstudio",
        twitter: "https://x.com/basementstudio",
        linkedIn: "https://www.linkedin.com/company/basementstudio/"
      }
    })

    expect(schema.award).toEqual(["FWA Site of the Day - basement.studio 2025"])
  })
})

describe("generateBlogPostingSchema", () => {
  test("includes canonical article metadata and structured publisher details", () => {
    const schema = generateBlogPostingSchema({
      _title: "Post",
      _slug: "post",
      date: "2026-01-01",
      intro: {
        json: {
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "A complete blog intro that should remain intact in structured data."
                }
              ]
            }
          ]
        }
      },
      _sys: {
        createdAt: "2026-01-02T00:00:00.000Z"
      },
      categories: [{ _title: "Design" }, { _title: "Typeface" }],
      authors: [
        {
          _title: "Jane Doe",
          url: "https://janedoe.dev"
        }
      ],
      hero: {
        heroImage: {
          url: "https://assets.basehub.com/example/hero.png",
          width: 1600,
          height: 900
        }
      }
    })

    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://basement.studio/post/post#article",
      headline: "Post",
      url: "https://basement.studio/post/post",
      mainEntityOfPage: "https://basement.studio/post/post",
      inLanguage: "en",
      datePublished: "2026-01-01",
      dateModified: "2026-01-02T00:00:00.000Z",
      description:
        "A complete blog intro that should remain intact in structured data.",
      image: {
        "@type": "ImageObject",
        url: "https://assets.basehub.com/example/hero.png",
        contentUrl: "https://assets.basehub.com/example/hero.png",
        width: 1600,
        height: 900
      },
      author: {
        "@type": "Person",
        name: "Jane Doe",
        url: "https://janedoe.dev"
      },
      articleSection: ["Design", "Typeface"],
      publisher: {
        "@type": "Organization",
        name: "basement.studio",
        url: "https://basement.studio",
        logo: {
          "@type": "ImageObject",
          url: "https://assets.basehub.com/dd0abb74/a8d4b8ac866cf524bba8c668e1c0316f/basementlogo.svg",
          width: 112,
          height: 112,
          caption: "basement.studio logo"
        }
      }
    })
  })
})

describe("generateCreativeWorkSchema", () => {
  test("uses full descriptions, stable ids, keywords, language, and project awards", () => {
    const schema = generateCreativeWorkSchema({
      _title: "Vercel Ship",
      project: {
        _slug: "vercel-ship-a-home-for-innovation",
        year: 2024,
        categories: [
          { _title: "Websites & Features" },
          { _title: "Marketing Execution" },
          { _title: "IRL Experience Design" }
        ],
        client: {
          _title: "Vercel",
          website: "https://vercel.com"
        },
        content: {
          json: {
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "A full description that should not be truncated in the structured data output."
                  }
                ]
              }
            ]
          }
        },
        projectWebsite: "https://vercel.com/ship",
        awards: [
          {
            title: "Awwwards Developer Award",
            date: "2024-06-01",
            projectName: "Vercel Ship"
          }
        ]
      }
    })

    expect(schema).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "@id":
        "https://basement.studio/showcase/vercel-ship-a-home-for-innovation#work",
      name: "Vercel Ship",
      url: "https://basement.studio/showcase/vercel-ship-a-home-for-innovation",
      dateCreated: "2024",
      description:
        "A full description that should not be truncated in the structured data output.",
      keywords: [
        "Websites & Features",
        "Marketing Execution",
        "IRL Experience Design"
      ],
      sameAs: "https://vercel.com/ship",
      creator: {
        "@type": "Organization",
        name: "basement.studio",
        url: "https://basement.studio"
      },
      inLanguage: "en",
      award: ["Awwwards Developer Award - Vercel Ship 2024"]
    })
  })
})
