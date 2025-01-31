"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import { useIsOnTab } from "@/hooks/use-is-on-tab"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { cn } from "@/utils/cn"

import { useContactStore } from "../contact/contact-store"
import { useNavigationStore } from "../navigation-handler/navigation-store"

const Logo = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 93 14"
    className={className}
  >
    <path d="M3.279 5.128c.352-1.488 1.28-1.904 3.2-1.904 2.848 0 3.504.704 3.504 4.288v1.392c0 3.568-.672 4.288-3.664 4.288-1.776 0-2.816-.832-3.12-2.496V13H.223V.2h3.056v4.928Zm.016 4.496c.096.608.656.928 1.728.928 1.472 0 1.744-.32 1.744-1.712V7.608c0-1.424-.272-1.744-1.744-1.744-1.088 0-1.648.416-1.728 1.28v2.48Zm7.712.608c0-2.464.576-2.928 3.664-2.928l3.04-.016v-.544c0-1.104-.256-1.296-1.6-1.296-1.504 0-1.776.192-1.744 1.296h-3.04V6.36c0-2.64.704-3.136 4.448-3.136h.736c3.568 0 4.24.512 4.24 3.312V13h-3.04v-1.696c-.416 1.28-1.488 1.872-2.992 1.888-3.136.096-3.712-.368-3.712-2.96Zm3.2.032c0 .64.24.768 1.488.768h.16c1.344-.032 1.856-.32 1.856-1.072v-.416l-2.512.016c-.832 0-.992.112-.992.704Zm7.568-.256V9.8h2.88v.208c0 .736.4.944 1.888.944 1.376 0 1.744-.16 1.744-.736 0-.384-.336-.64-1.744-.896-.56-.112-2.016-.336-2.976-.704-1.312-.512-1.648-1.232-1.648-2.512 0-2.448.704-2.88 4.336-2.88h.736c3.568 0 4.24.496 4.24 3.232v.288h-3.04v-.288c0-.784-.336-1.008-1.568-1.008-1.184 0-1.504.16-1.504.752 0 .4.288.592 1.328.752 1.568.256 2.304.448 3.136.688 1.52.448 1.888 1.328 1.888 2.8 0 2.304-.736 2.752-4.768 2.752h-.736c-3.52 0-4.192-.512-4.192-3.184Zm10.624-1.792c0-4.224.736-4.992 4.656-4.992h.736c3.952 0 4.688.704 4.688 4.512V9.24h-6.88v.048c0 1.392.288 1.664 1.84 1.664 1.488 0 1.76-.176 1.76-.992h3.2c0 2.72-.72 3.232-4.608 3.232h-.736c-3.92 0-4.656-.784-4.656-4.976Zm3.2-1.232h3.68c-.016-1.296-.336-1.536-1.84-1.536-1.552 0-1.84.24-1.84 1.488v.048ZM43.823 13V3.416h3.04V5.24c.336-1.44 1.152-2.016 2.576-2.016 2.432 0 2.96.384 3.088 2.208.352-1.52 1.328-2.208 2.944-2.208 2.928 0 3.472.56 3.472 3.568L58.959 13h-3.04V7.256c0-1.248-.208-1.488-1.424-1.488-1.024 0-1.552.528-1.584 1.584L52.927 13h-3.024V7.256c0-1.248-.24-1.488-1.456-1.488-1.056 0-1.584.56-1.584 1.68V13h-3.04Zm16.32-4.784c0-4.224.736-4.992 4.672-4.992h.736c3.92 0 4.656.704 4.656 4.512V9.24h-6.88v.048c0 1.392.288 1.664 1.872 1.664 1.472 0 1.744-.176 1.744-.992h3.184c0 2.72-.72 3.232-4.576 3.232h-.736c-3.936 0-4.672-.784-4.672-4.976Zm3.184-1.232h3.696c-.016-1.296-.336-1.536-1.824-1.536-1.584 0-1.872.24-1.872 1.488v.048ZM71.535 13V3.416h3.04v1.936c.368-1.552 1.296-2.128 3.056-2.128 2.784 0 3.312.56 3.312 3.568L80.959 13h-3.04V7.512c0-1.472-.256-1.744-1.664-1.744-1.104 0-1.664.496-1.68 1.52V13h-3.04Zm10.208-7.04V3.416h1.104V1.352h2.88v2.064h2.736V5.96h-2.736v3.36c0 .8.176.96 1.12.96h1.76V13h-2.08c-3.216 0-3.84-.512-3.84-3.216V5.96h-.944ZM89.759 13v-2.72h2.736V13h-2.736Z" />
  </svg>
)

interface NavbarContentProps {
  links: {
    title: string
    href: string
    count?: number
  }[]
}

export const NavbarContent = ({ links }: NavbarContentProps) => {
  const [music, setMusic] = useState(true)
  const { setVolumeMaster } = useSiteAudio()
  const { setIsContactOpen, isContactOpen } = useContactStore()
  const isOnTab = useIsOnTab()
  const router = useRouter()

  const handleNavigation = useCallback(
    (route: string) => {
      const setStairVisibility =
        useNavigationStore.getState().setStairVisibility

      router.push(route, { scroll: false })

      if (route === "/") {
        setTimeout(() => {
          setStairVisibility(false)
        }, 2200)
      } else {
        setStairVisibility(true)
      }
    },
    [router]
  )

  const handleMute = () => {
    setVolumeMaster(music ? 0 : 1)
    setMusic(!music)
  }

  useEffect(() => {
    if (!isOnTab) {
      setVolumeMaster(0)
    } else {
      setVolumeMaster(music ? 1 : 0)
    }
  }, [isOnTab, music, setVolumeMaster])

  return (
    <nav
      className={cn(
        "fixed top-0 z-navbar flex h-9 w-full items-center justify-between",
        "[background-image:linear-gradient(#000000_1px,transparent_1px),linear-gradient(to_right,#000000_1px,rgba(0,0,0,0.7)_1px)] [background-position-y:1px] [background-size:2px_2px]",
        "after:absolute after:-bottom-px after:left-0 after:h-px after:w-full after:bg-brand-w1/30"
      )}
    >
      <div className="grid-layout">
        <button
          onClick={() => handleNavigation("/")}
          className="col-start-1 col-end-3 w-fit"
        >
          <Logo className="h-3.5 text-brand-w1" />
        </button>

        <div className="ga-5 col-start-3 col-end-11 flex w-full justify-center gap-5">
          {links.map((link) => (
            <div key={link.href} className="flex items-center gap-1 text-p">
              <button
                className="space-x-1 text-brand-w1 transition-colors duration-300 hover:text-brand-o"
                onClick={() => handleNavigation(link.href)}
              >
                {link.title}
              </button>
              {link.count && (
                <sup className="text-caption text-brand-g1">({link.count})</sup>
              )}
            </div>
          ))}
        </div>

        <div className="col-start-11 col-end-13 ml-auto flex items-center gap-5">
          <button
            onClick={handleMute}
            className="space-x-1 text-p text-brand-w2"
          >
            <span>Music:</span>
            <span
              className={cn(
                "uppercase",
                music ? "text-brand-w1" : "text-brand-g1"
              )}
            >
              {music ? "On" : "Off"}
            </span>
          </button>
          <button
            onClick={() => setIsContactOpen(!isContactOpen)}
            className="text-p capitalize text-brand-w1"
          >
            {isContactOpen ? "Close" : "Contact Us"}
          </button>
        </div>
      </div>
    </nav>
  )
}
