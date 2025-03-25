"use client"

import { motion } from "motion/react"

import { Link } from "@/components/primitives/link"
import { cn } from "@/utils/cn"
import { useMedia } from "@/hooks/use-media"

import { useHandleContactButton } from "@/hooks/use-handle-contact"

interface InternalLinksProps {
  className?: string
  links: { title: string; href: string; count?: number }[]
  onClick?: () => void
  onNav?: boolean
  animated?: boolean
}

const STAGER_DELAY = 0.15
const STAGER_DURATION = 0.25
const STAGER_STEPS = 0.08

const getDelay = (idx: number, length: number, instant?: boolean) =>
  (instant ? 0 : STAGER_DELAY) + (idx / length) * STAGER_STEPS

export const InternalLinks = ({
  className,
  links,
  onClick,
  onNav,
  animated = false
}: InternalLinksProps) => {
  const handleContactButton = useHandleContactButton()
  const isMobile = useMedia("(max-width: 1024px)")

  const animateProps = animated
    ? {
        initial: { opacity: 0, transform: "translate3d(0, 15px, 0)" },
        animate: { opacity: 1, transform: "translate3d(0, 0px, 0)" },
        exit: { opacity: 0, transform: "translate3d(0, -15px, 0)" }
      }
    : {}

  return (
    <ul
      className={cn(
        "flex flex-col gap-y-2",
        onNav ? "!text-[2.75rem] tracking-[-0.02em]" : "!text-f-h1-mobile",
        "text-brand-w1 lg:!text-f-h2",
        className
      )}
    >
      {links.map((link, idx) => (
        <motion.li
          key={`${link.title}-${idx}`}
          {...animateProps}
          animate={{
            ...animateProps.animate,
            transition: {
              duration: STAGER_DURATION,
              delay: getDelay(idx, links.length)
            }
          }}
          exit={{
            ...animateProps.exit,
            transition: {
              duration: STAGER_DURATION,
              delay: getDelay(idx, links.length, true)
            }
          }}
          className="will-change-[transform,opacity]"
        >
          <Link
            className="flex w-fit gap-x-0.5 text-brand-w1"
            href={
              isMobile && link.title === "Lab"
                ? "https://basement.studio/lab"
                : link.href
            }
            onClick={onClick}
            target={isMobile && link.title === "Lab" ? "_blank" : undefined}
          >
            <span className="actionable">{link.title}</span>
            {link.count && (
              <sup className="translate-y-1.25 text-f-p-mobile !font-medium text-brand-g1 lg:text-f-p">
                <span className="tabular-nums">({link.count})</span>
              </sup>
            )}
          </Link>
        </motion.li>
      ))}
      <motion.li
        {...animateProps}
        animate={{
          ...animateProps.animate,
          transition: {
            duration: STAGER_DURATION,
            delay: getDelay(links.length, links.length)
          }
        }}
        exit={{
          ...animateProps.exit,
          transition: {
            duration: STAGER_DURATION,
            delay: getDelay(links.length, links.length, true)
          }
        }}
        className="will-change-[transform,opacity]"
      >
        <button
          onClick={handleContactButton}
          className={cn(
            "flex w-max flex-col gap-y-1",
            onNav ? "!text-[2.75rem] tracking-[-0.02em]" : "!text-f-h1-mobile",
            "text-brand-w1 lg:!text-f-h2"
          )}
        >
          <span className="actionable">Contact Us</span>
        </button>
      </motion.li>
    </ul>
  )
}

interface SocialLinksProps {
  className?: string
  links: {
    twitter: string
    instagram: string
    github: string
    linkedIn: string
  }
}

export const SocialLinks = ({ className, links }: SocialLinksProps) => (
  <div
    className={cn(
      "flex flex-row gap-x-1 !text-f-h4-mobile text-brand-g1 lg:!text-f-p",
      className
    )}
  >
    <Link className="h-max text-brand-w1" href={links.twitter} target="_blank">
      <span className="actionable">X (Twitter)</span>
    </Link>

    <Link
      className="h-max text-brand-w1"
      href={links.instagram}
      target="_blank"
    >
      <span className="actionable">Instagram</span>
    </Link>

    <Link className="h-max text-brand-w1" href={links.github} target="_blank">
      <span className="actionable">GitHub</span>
    </Link>

    <Link className="h-max text-brand-w1" href={links.linkedIn} target="_blank">
      <span className="actionable">LinkedIn</span>
    </Link>
  </div>
)

export const Copyright = ({ className }: { className?: string }) => (
  <p
    className={cn(
      "text-right !text-f-p-mobile text-brand-g1 lg:!text-f-p",
      className
    )}
  >
    © basement.studio LLC {new Date().getFullYear()} all rights reserved
  </p>
)

export const SoDa = ({ className }: { className?: string }) => (
  <div className={cn("mb-2 w-full", className)}>
    <Link
      className={cn(
        "!block text-right !text-f-p-mobile font-semibold text-brand-w1 lg:!text-f-p",
        className
      )}
      href="https://www.sodaspeaks.com/"
      target="_blank"
    >
      <span className="actionable actionable-no-underline gap-2">
        Proud Member of SoDA
        <SodaLogo className="size-6" />
      </span>
    </Link>
  </div>
)

const SodaLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 21 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <title>SoDA</title>
    <path fill="currentColor" d="M0 0h20.727v24H0z" />
    <path
      className="fill-brand-k"
      d="M2.889 17.133q.002-2.115-.004-4.229c0-.115.034-.146.16-.145.997.005 1.994-.002 2.992.004.496.003.99.044 1.477.139 1.234.24 1.993.925 2.32 2.025.187.635.247 1.283.258 1.937.012.762-.014 1.522-.196 2.27-.07.287-.169.565-.307.831-.353.683-.944 1.106-1.729 1.319-.632.17-1.282.21-1.936.211-.96.002-1.921-.002-2.882.003-.131.001-.156-.038-.156-.148q.004-2.108.003-4.217m2.025.025q0 1.305-.002 2.61c0 .089.012.137.133.133.436-.012.872.01 1.308-.014.84-.047 1.285-.37 1.51-1.108q.025-.084.046-.17c.103-.432.128-.87.133-1.31.006-.585-.008-1.17-.164-1.743-.17-.621-.577-1.002-1.295-1.08-.503-.055-1.009-.024-1.513-.038-.133-.004-.16.038-.159.149.005.857.003 1.714.003 2.571M14.182 12.704c.313 0 .625.005.937-.003.111-.002.156.027.19.126q.848 2.505 1.7 5.008.6 1.76 1.198 3.521c.048.139.047.14-.115.14-.593 0-1.186-.003-1.778.002-.108.001-.152-.032-.18-.124-.116-.374-.244-.745-.359-1.12-.027-.087-.066-.117-.168-.117q-1.455.006-2.909 0c-.105 0-.153.027-.18.121-.113.375-.237.747-.349 1.123-.026.09-.069.117-.17.117a102 102 0 0 0-1.75 0c-.133.002-.138-.036-.104-.135q1.097-3.215 2.19-6.432.361-1.052.715-2.108c.03-.093.075-.124.18-.121.318.006.635.002.952.002m-.022 2.51c-.02.033-.028.043-.032.055q-.53 1.575-1.062 3.15c-.032.094.005.103.092.103.648-.002 1.295-.005 1.942.001.129.001.141-.03.107-.132-.207-.615-.407-1.233-.61-1.849-.142-.435-.287-.87-.437-1.327M6.08 11.264c-.956-.014-1.897-.105-2.792-.442a5 5 0 0 1-.638-.296c-.066-.037-.076-.067-.032-.128q.459-.626.909-1.257c.05-.07.088-.059.154-.025.901.463 1.87.63 2.895.55a1.6 1.6 0 0 0 .643-.173c.173-.095.298-.228.34-.409.138-.597-.044-.963-.563-1.18-.503-.21-1.037-.338-1.56-.495-.486-.147-.959-.316-1.387-.576C3.384 6.43 3.047 5.859 3 5.14c-.03-.468.006-.929.205-1.368.324-.716.944-1.11 1.738-1.308.541-.134 1.095-.162 1.653-.145.781.022 1.547.121 2.275.393.119.044.29.06.335.152.043.086-.085.198-.139.298-.213.389-.434.774-.644 1.165-.049.09-.091.094-.187.056a5 5 0 0 0-2.522-.29 1.2 1.2 0 0 0-.366.106.61.61 0 0 0-.367.458c-.08.434.074.716.51.914.388.176.806.28 1.215.404.488.149.97.31 1.437.51.9.389 1.372 1.028 1.413 1.935.019.429.008.853-.146 1.264-.274.73-.858 1.157-1.642 1.384-.55.159-1.116.197-1.688.195M17.405 7.81c.002.54-.033 1.078-.176 1.606-.265.974-.925 1.573-2.017 1.761a5.8 5.8 0 0 1-2.108-.014c-1.047-.206-1.7-.8-1.954-1.737a6.16 6.16 0 0 1-.004-3.243c.26-.973.955-1.558 2.041-1.743a5.7 5.7 0 0 1 2.16.034c.935.202 1.538.73 1.823 1.562.198.578.238 1.174.235 1.774m-4.467.036c0 .171-.005.343.002.514q.01.2.044.398c.095.616.418.915 1.068.95.82.042 1.218-.242 1.336-.957.068-.407.056-.817.05-1.226-.006-.293-.029-.584-.128-.866-.117-.336-.362-.543-.745-.612a2.4 2.4 0 0 0-.562-.023c-.521.028-.834.258-.968.714-.107.364-.106.736-.097 1.108"
    />
  </svg>
)
