"use client"

import { motion } from "motion/react"
import Image from "next/image"
import Link from "next/link"

const VoteButton = ({
  href,
  className
}: {
  href: string
  className?: string
}) => (
  <Link
    href={href}
    target="_blank"
    className="flex items-center justify-center border border-brand-w1 px-6 py-2 text-brand-w1 transition-all hover:border-brand-o hover:bg-brand-o hover:text-brand-k"
  >
    <span>Vote Now</span>
  </Link>
)

const WebbyPage = () => {
  return (
    <div className="relative flex flex-col gap-14 pb-4 pt-[calc(36px+1rem)]">
      {/* Hero Section */}
      <section className="grid-layout">
        <div className="col-span-full flex flex-col items-start lg:col-span-11">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-block rounded-full border border-white/20 bg-white/10 px-4 py-1 backdrop-blur-sm"
          >
            <span className="text-sm font-medium text-white/90">
              People's Voice Awards 2024
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-pretty text-f-h1-mobile text-brand-w1 lg:text-[5.4375rem] lg:leading-[4.875rem]"
          >
            Help Basement Win <br />
            <span className="text-brand-o">Two Webby Awards</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 flex items-center gap-3"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-o"></span>
            <p className="text-lg font-medium text-brand-o">
              Voting is now open
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-full lg:w-[60%]"
          >
            <p className="text-balance text-f-h4-mobile text-brand-w1 lg:text-f-h4">
              We're thrilled to be recognized with two nominations at the
              prestigious Webby Awards. Your vote helps us bring home the
              People's Voice award.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Award Cards */}
      <section className="grid-layout">
        <div className="col-span-full grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* First Award */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="corner-borders with-diagonal-lines group relative flex cursor-pointer flex-col overflow-hidden bg-brand-k p-6 md:p-8"
            onClick={() => {
              window.open("https://bsmnt.link/WEBBY-1", "_blank")
            }}
          >
            {/* Decorative corner */}
            <div className="absolute -left-px -top-px h-[60px] w-[60px] border-l border-t border-brand-o"></div>
            <div className="absolute -bottom-px -right-px h-[60px] w-[60px] border-b border-r border-brand-o"></div>

            <div className="relative mb-8 aspect-video w-full overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-zinc-900 transition-transform duration-500 group-hover:scale-[1.03]">
                <div className="relative h-full w-full opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100">
                  <Image
                    src="https://assets.basehub.com/dd0abb74/cc0923956fad893f098e4a926a207c84/img-1.jpg"
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500"
                    priority
                  />
                </div>
              </div>
              <div className="absolute left-4 top-4 z-10 rounded-full bg-brand-o/80 px-3 py-1 backdrop-blur-sm">
                <span className="text-xs font-medium">
                  Best Visual Design - Aesthetic
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-f-h3-mobile font-bold text-brand-w1 md:text-f-h3">
                Daylight Computer Store
              </h2>
            </div>

            <div className="mt-6">
              <VoteButton href="https://bsmnt.link/WEBBY-1" />
            </div>
          </motion.div>

          {/* Second Award */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="corner-borders with-diagonal-lines group relative flex cursor-pointer flex-col overflow-hidden bg-brand-k p-6 md:p-8"
            onClick={() => {
              window.open("https://bsmnt.link/WEBBY-3", "_blank")
            }}
          >
            {/* Decorative corner */}
            <div className="absolute -left-px -top-px h-[60px] w-[60px] border-l border-t border-brand-o"></div>
            <div className="absolute -bottom-px -right-px h-[60px] w-[60px] border-b border-r border-brand-o"></div>

            <div className="relative mb-8 aspect-video w-full overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/80 to-zinc-900 transition-transform duration-500 group-hover:scale-[1.03]">
                <div className="relative h-full w-full opacity-90 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100">
                  <Image
                    src="https://assets.basehub.com/dd0abb74/0b9de2aedc5272e59e89a06dd4220f69/img-2.jpg"
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500"
                    priority
                  />
                </div>
              </div>
              <div className="absolute left-4 top-4 z-10 rounded-full bg-brand-o/80 px-3 py-1 backdrop-blur-sm">
                <span className="text-xs font-medium">Events</span>
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-f-h3-mobile font-bold text-brand-w1 md:text-f-h3">
                Next.js Conference
              </h2>
            </div>

            <div className="mt-6">
              <VoteButton href="https://bsmnt.link/WEBBY-3" />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default WebbyPage
