"use client"

import NextLink from "next/link"

import { useHandleNavigation } from "@/hooks/use-handle-navigation"

interface LinkProps {
  href: string
  children?: React.ReactNode
  className?: string
  target?: "_blank" | "_self"
  rel?: string
  onClick?: () => void
  dangerouslySetInnerHTML?: {
    __html: string
  }
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

export const Link = ({
  href,
  children,
  className,
  target,
  rel,
  onClick,
  ...rest
}: LinkProps) => {
  const { handleNavigation } = useHandleNavigation()

  return href.includes("http") || href.includes("mailto") ? (
    <NextLink
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={onClick}
      {...rest}
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
      {...rest}
    >
      {children}
    </a>
  )
}
