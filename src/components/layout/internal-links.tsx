"use client"

import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"
import { useContactStore } from "../contact/contact-store"

interface InternalLinksProps {
  className?: string
  links: {
    title: string
    href: string
    count?: number
  }[]
}

const InternalLinks = ({ className, links }: InternalLinksProps) => {
  const isContactOpen = useContactStore((state) => state.isContactOpen)
  const setIsContactOpen = useContactStore((state) => state.setIsContactOpen)

  return (
    <ul className={cn("flex flex-col gap-y-1 text-p text-brand-g1", className)}>
      {links.map((link) => (
        <li key={link.title}>
          <Link
            className="flex gap-x-0.5 text-h2 text-brand-w1"
            href={link.href}
          >
            <span className="actionable">{link.title}</span>
            {link.count && (
              <sup className="translate-y-1.25 text-p !font-medium text-brand-g1">
                <span className="tabular-nums">({link.count})</span>
              </sup>
            )}
          </Link>
        </li>
      ))}
      <li>
        <button
          onClick={() => setIsContactOpen(!isContactOpen)}
          className="flex gap-x-0.5 text-h2 text-brand-w1"
        >
          <span className="actionable">Contact Us</span>
        </button>
      </li>
    </ul>
  )
}

export default InternalLinks
