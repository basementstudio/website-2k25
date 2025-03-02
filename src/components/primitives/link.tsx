"use client"

import NextLink from "next/link"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

interface LinkProps {
  href: string
  children: React.ReactNode
  className?: string
  target?: "_blank" | "_self"
  rel?: string
  onClick?: () => void
}

export const Link = ({
  href,
  children,
  className,
  target,
  rel,
  onClick
}: LinkProps) => {
  const { handleNavigation } = useHandleNavigation()

  return href.includes("http") ? (
    <NextLink
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={onClick}
    >
      {children}
    </NextLink>
  ) : (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault()
        handleNavigation(href)
        onClick?.()
      }}
      className={className}
    >
      {children}
    </a>
  )
}
