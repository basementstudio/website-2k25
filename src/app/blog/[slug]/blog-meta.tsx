import Image from "next/image"
import Link from "next/link"

import { formatDate } from "@/utils/format-date"

const socialLinks = [
  {
    icon: "/icons/x.svg",
    href: (slug: string, title: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://basement.studio/blog/${slug.toLowerCase().replace(/ /g, "-")}`)}`,
    label: "Share on X"
  },
  {
    icon: "/icons/linkedin.svg",
    href: (slug: string) =>
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`https://basement.studio/blog/${slug.toLowerCase().replace(/ /g, "-")}`)}`,
    label: "Share on LinkedIn"
  }
]

interface BlogMetaProps {
  _slug: string
  _sys: {
    createdAt: string
  }
  _title: string
  intro?: {
    __typename: "Intro"
    readingTime: number
  } | null
  date: string | null
  content?: {
    [key: string]: any
  } | null
  categories?:
    | {
        [key: string]: any
      }[]
    | null
  heroImage?: {
    [key: string]: any
  } | null
  authors?:
    | {
        [key: string]: any
      }[]
    | null
}

export default function BlogMeta({
  data,
  categories
}: {
  data: BlogMetaProps
  categories: boolean
}) {
  return (
    <div className="grid-layout relative text-paragraph">
      {categories && (
        <Link href="/blog" className="col-span-1 col-start-1 text-brand-w1">
          ← <span className="underline">Blog</span>
        </Link>
      )}
      <div className="col-span-10 col-start-2 flex justify-center">
        <div className="flex w-full max-w-[900px] flex-col gap-3">
          {!categories && <hr className="mt-10 border-brand-w1/20" />}
          {categories && (
            <div className="flex gap-1">
              {data.categories?.map((category) => (
                <p
                  key={category._title}
                  className="h-max w-max bg-brand-g2 px-1 text-[11px] text-brand-w2"
                >
                  {category._title}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <p className="text-brand-g1">
              {formatDate(data.date || "")} ·{" "}
              {data.authors?.map((author) => author._title).join(", ") ||
                "basement.studio"}
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href(data._slug, data._title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-opacity hover:opacity-80"
                  aria-label={social.label}
                >
                  <Image
                    src={social.icon}
                    alt={social.label}
                    width={16}
                    height={16}
                  />
                </Link>
              ))}
            </div>
          </div>
          {categories && <hr className="border-brand-w1/20" />}
        </div>
      </div>
    </div>
  )
}
