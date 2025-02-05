"use client"

import NextLink from "next/link"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export const Link = ({ href, children, className }: LinkProps) => {
  const { handleNavigation } = useHandleNavigation()

  return href.includes("http") ? (
    <NextLink href={href} className={className}>
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
