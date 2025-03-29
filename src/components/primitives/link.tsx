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
  prefetch?: boolean
  onClick?: () => void
  dangerouslySetInnerHTML?: {
    __html: string
  }
  disabled?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onFocus?: () => void
  onBlur?: () => void
  fromMobileNav?: boolean
}

export const Link = ({
  href,
  children,
  className,
  target,
  rel,
  onClick,
  prefetch,
  disabled,
  fromMobileNav,
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
      prefetch={prefetch}
      {...rest}
    >
      {children}
    </NextLink>
  ) : (
    <a
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : undefined}
      href={href}
      onClick={(e) => {
        e.preventDefault()
        // if href is /post/*, router.push instead of handleNavigation
        if (href.includes("/post/") || href.includes("/showcase/")) {
          router.push(href)
        } else {
          handleNavigation(href, fromMobileNav)
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
