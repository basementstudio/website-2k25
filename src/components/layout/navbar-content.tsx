"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Grid } from "@/components/grid"
import { useHandleNavigation } from "@/hooks/use-handle-navigation"
import { useIsOnTab } from "@/hooks/use-is-on-tab"
import { useSiteAudio } from "@/hooks/use-site-audio"
import { cn } from "@/utils/cn"

import { useContactStore } from "../contact/contact-store"
import MusicToggle from "./music-toggle"

const Logo = ({ className }: { className?: string }) => (
  <svg
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 107 15"
    className={className}
  >
    <path d="M3.54378 5.68462c.40819-1.71646 1.48431-2.19633 3.71077-2.19633 3.30255 0 4.06325.81209 4.06325 4.94636v1.60575c0 4.1158-.7792 4.9463-4.24879 4.9463-2.05947 0-3.26547-.9597-3.618-2.8792v2.6578H0V0h3.54378v5.68462Zm.01856 5.18628c.11132.7014.76071 1.0705 2.00381 1.0705 1.70696 0 2.02237-.3691 2.02237-1.97485V8.54539c0-1.64263-.31541-2.01176-2.02237-2.01176-1.26166 0-1.91104.47987-2.00381 1.47652v2.86075Zm8.94296.7014c0-2.84234.6679-3.37758 4.2488-3.37758l3.5252-.01846v-.62752c0-1.27351-.2968-1.49499-1.8553-1.49499-1.7441 0-2.0595.22148-2.0224 1.49499h-3.5252v-.44296c0-3.04534.8163-3.61749 5.1579-3.61749h.8535c4.1375 0 4.9168.59061 4.9168 3.82051v7.4565h-3.5253v-1.9564c-.4824 1.4765-1.7255 2.1594-3.4695 2.1778-3.6366.1108-4.3045-.4245-4.3045-3.4144Zm3.7108.0369c0 .7382.2783.8859 1.7255.8859h.1855c1.5585-.0369 2.1522-.3691 2.1522-1.2366v-.4799l-2.9129.0185c-.9648 0-1.1503.1292-1.1503.8121Zm8.7759-.2953v-.24h3.3397v.24c0 .849.4639 1.0889 2.1894 1.0889 1.5956 0 2.0223-.1846 2.0223-.849 0-.4429-.3896-.7383-2.0223-1.0336-.6494-.1292-2.3378-.3875-3.451-.81204-1.5215-.59061-1.9111-1.42116-1.9111-2.89769 0-2.82385.8164-3.32218 5.0281-3.32218h.8535c4.1375 0 4.9167.57215 4.9167 3.72823v.33222h-3.5252v-.33222c0-.90437-.3896-1.16277-1.8183-1.16277-1.3729 0-1.744.18457-1.744.86746 0 .46142.3339.6829 1.5399.86746 1.8183.29531 2.6718.51679 3.6366.79363 1.7626.51679 2.1894 1.5319 2.1894 3.2299 0 2.6578-.8535 3.1745-5.5291 3.1745h-.8535c-4.0818 0-4.8611-.5906-4.8611-3.6728Zm12.3198-2.06716c0-4.87253.8535-5.75845 5.3991-5.75845h.8535c4.5828 0 5.4363.81209 5.4363 5.20475V10.428h-7.9782v.0553c0 1.6058.334 1.9195 2.1337 1.9195 1.7255 0 2.041-.203 2.041-1.1443h3.7107c0 3.1376-.8349 3.7282-5.3435 3.7282h-.8535c-4.5456 0-5.3991-.9043-5.3991-5.73996Zm3.7107-1.42115h4.2674c-.0185-1.49499-.3896-1.77184-2.1337-1.77184-1.7997 0-2.1337.27685-2.1337 1.71647v.05537Zm9.5367 6.93971V3.70977h3.5252v2.10405c.3897-1.66109 1.3359-2.32553 2.9872-2.32553 2.8202 0 3.4325.44296 3.5809 2.54701.4082-1.75338 1.54-2.54701 3.4139-2.54701 3.3954 0 4.0262.64598 4.0262 4.11582l.0186 7.16119h-3.5253V8.13935c0-1.43962-.2412-1.71646-1.6513-1.71646-1.1874 0-1.7997.60906-1.8368 1.8272l.0186 6.51521h-3.5067V8.13935c0-1.43962-.2783-1.71646-1.6884-1.71646-1.2246 0-1.8369.64598-1.8369 1.93794v6.40447h-3.5252Zm18.9249-5.51856c0-4.87253.8535-5.75845 5.4178-5.75845h.8534c4.5457 0 5.3992.81209 5.3992 5.20475V10.428h-7.9781v.0553c0 1.6058.3339 1.9195 2.1708 1.9195 1.7069 0 2.0223-.203 2.0223-1.1443h3.6922c0 3.1376-.8349 3.7282-5.3064 3.7282h-.8534c-4.5643 0-5.4178-.9043-5.4178-5.73996Zm3.6923-1.42115h4.2859c-.0186-1.49499-.3896-1.77184-2.1151-1.77184-1.8369 0-2.1708.27685-2.1708 1.71647v.05537Zm9.5181 6.93971V3.70977h3.5252v2.23325c.4267-1.79029 1.5029-2.45473 3.5438-2.45473 3.2284 0 3.8406.64598 3.8406 4.11582l.0186 7.16119h-3.5252V8.43465c0-1.698-.2969-2.01176-1.9296-2.01176-1.2803 0-1.9296.57215-1.9482 1.75337v6.58904h-3.5252Zm11.8373-8.12094V3.70977h1.2802v-2.3809h3.3397v2.3809h3.1723v2.93459h-3.1723v3.87584c0 .9229.2041 1.1074 1.2993 1.1074h2.04v3.1377h-2.412c-3.7289 0-4.4525-.5907-4.4525-3.7098V6.64436h-1.0947Zm9.2952 8.12094v-3.1377H107v3.1377h-3.173Z" />
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
  const { music, handleMute, setVolumeMaster } = useSiteAudio()

  const { handleNavigation } = useHandleNavigation()

  const { setIsContactOpen, isContactOpen } = useContactStore()

  const isOnTab = useIsOnTab()

  const pathname = usePathname()

  useEffect(
    () => setVolumeMaster(!isOnTab ? 0 : music ? 1 : 0),
    [isOnTab, music, setVolumeMaster]
  )

  return (
    <nav
      className={cn(
        "fixed top-0 z-navbar flex w-full flex-col items-center justify-center",
        "[background-image:linear-gradient(#000000_1px,transparent_1px),linear-gradient(to_right,#000000_1px,rgba(0,0,0,0.7)_1px)] [background-position-y:1px] [background-size:2px_2px]",
        "after:absolute after:-bottom-px after:left-0 after:h-px after:w-full after:bg-brand-w1/30"
      )}
    >
      <div className="grid-layout h-9">
        <button
          onClick={() => handleNavigation("/")}
          className="col-start-1 col-end-3 w-fit"
        >
          <Logo className="h-[0.9375rem] text-brand-w1" />
        </button>

        <div className="col-start-3 col-end-11 flex w-full justify-center gap-5">
          {links.map((link) => (
            <div key={link.href} className="flex items-center gap-1 text-p">
              <button
                className={cn(
                  "group space-x-1 text-brand-w1 transition-colors duration-300 hover:text-brand-o",
                  link.href === pathname && "!text-brand-o"
                )}
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
            id="nav-contact"
            onClick={() => setIsContactOpen(!isContactOpen)}
            className={cn(
              "!text-p capitalize text-brand-w1 transition-colors duration-300 hover:text-brand-o",
              isContactOpen && "text-brand-g1"
            )}
          >
            Contact Us
          </button>
          <button
            onClick={handleMute}
            className="inline-flex w-18 items-center space-x-1 text-p text-brand-w2"
            aria-label={music ? "Turn music off" : "Turn music on"}
          >
            <MusicToggle music={music} />
          </button>
        </div>
      </div>
      <Grid />
      <div className="mx-auto -mb-px h-px w-full max-w-full px-1.75">
        <div className="with-dots h-px" />
      </div>
    </nav>
  )
}
