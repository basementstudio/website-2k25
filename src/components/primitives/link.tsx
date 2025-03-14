"use client"

import NextLink from "next/link"
import { useRouter } from "next/navigation"

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
  const router = useRouter()

  const handleMouseEnter = () => {
    if (!href.includes("http") && !href.includes("mailto")) {
      router.prefetch(href)
    }
  }

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
        if (!href.includes("/showcase/")) {
          handleNavigation(href)
        } else {
          router.push(href)
        }
        onClick?.()
      }}
      onMouseEnter={handleMouseEnter}
      className={className}
      {...rest}
    >
      {children}
    </a>
  )
}
