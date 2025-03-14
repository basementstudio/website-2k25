import { LinkedInIcon, XIcon } from "@/components/icons/icons"
import { Link } from "@/components/primitives/link"
import { formatDate } from "@/utils/format-date"

import { Back } from "./back"

const socialLinks = [
  {
    Icon: LinkedInIcon,
    href: (slug: string) =>
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(`https://basement.studio/post/${slug.toLowerCase().replace(/ /g, "-")}`)}`,
    label: "Share on LinkedIn"
  },
  {
    Icon: XIcon,
    href: (slug: string, title: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(`https://basement.studio/post/${slug.toLowerCase().replace(/ /g, "-")}`)}`,
    label: "Share on X"
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
    <div className="grid-layout relative !px-0 text-p">
      {categories && <Back />}
      <div className="col-span-full flex justify-center lg:col-span-10 lg:col-start-2">
        <div className="flex w-full flex-col gap-3 lg:max-w-[846px]">
          {!categories && <hr className="mt-10 border-brand-w1/20" />}
          {categories && (
            <div className="flex gap-1">
              {data.categories?.map((category) => (
                <p
                  key={category._title}
                  className="h-max w-max bg-brand-g2 px-1 text-mobile-p text-brand-w2 lg:text-p"
                >
                  {category._title}
                </p>
              ))}
            </div>
          )}
          <div className="flex justify-between">
            <p className="inline-flex items-center gap-x-2 text-brand-w2">
              {data.date ? formatDate(data.date) : null}
              <span className="inline-block size-1 bg-brand-g1" />{" "}
              {data.authors?.map((author) => author._title).join(", ") ||
                "basement.studio"}
            </p>
            <div className="flex gap-2">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href(data._slug, data._title)}
                  className="transition-opacity hover:opacity-80"
                  aria-label={social.label}
                >
                  <social.Icon className="text-brand-w1" />
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
