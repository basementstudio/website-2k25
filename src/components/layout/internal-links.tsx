"use client"

import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"
import { useContactStore } from "../contact/contact-store"
import { useHandleContactButton } from "@/hooks/use-handle-contact"

interface InternalLinksProps {
  className?: string
  links: {
    title: string
    href: string
    count?: number
  }[]
}

const InternalLinks = ({ className, links }: InternalLinksProps) => {
  const handleContactButton = useHandleContactButton()

  return (
    <ul
      className={cn(
        "flex flex-col gap-y-1 text-f-p-mobile text-brand-g1 lg:text-f-p",
        className
      )}
    >
      {links.map((link) => (
        <li key={link.title}>
          <Link className="flex gap-x-0.5 text-brand-w1" href={link.href}>
            <span className="actionable">{link.title}</span>
            {link.count && (
              <sup className="translate-y-1.25 text-f-p-mobile !font-medium text-brand-g1 lg:text-f-p">
                <span className="tabular-nums">({link.count})</span>
              </sup>
            )}
          </Link>
        </li>
      ))}
      <li>
        <button
          onClick={handleContactButton}
          className="flex gap-x-0.5 text-brand-w1"
        >
          <span className="actionable">Contact Us</span>
        </button>
      </li>
    </ul>
  )
}

export default InternalLinks
