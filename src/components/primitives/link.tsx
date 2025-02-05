"use client"

import NextLink from "next/link"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  target?: string
  rel?: string
}

export const Link = ({ href, children, className, target, rel }: LinkProps) => {
  const { handleNavigation } = useHandleNavigation()

  return href.includes("http") ? (
    <NextLink
      href={href}
      target={target ?? ""}
      rel={rel ?? "noopener noreferrer"}
      className={className}
    >
      {children}
    </NextLink>
  ) : (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        handleNavigation(href)
      }}
      className={className}
    >
      {children}
    </a>
  )
}
