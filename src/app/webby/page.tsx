"use client"

import { track } from "@vercel/analytics"
import { motion } from "motion/react"
import Image from "next/image"

const VoteButton = () => (
  <div className="relative z-10 flex items-center justify-center border border-brand-w1 px-6 py-2 text-brand-w1 transition-all hover:border-brand-o hover:bg-brand-o hover:text-brand-k">
    <span>Vote Now</span>
  </div>
)

const WebbyPage = () => {
  return (
    <div className="relative flex flex-col gap-14 pb-4 pt-[calc(36px+1rem)]">
      {/* Hero Section */}
      <section className="grid-layout">
        <div className="col-span-full flex flex-col items-start lg:col-span-11">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8 text-pretty text-f-h1-mobile text-brand-w1 lg:text-[5.4375rem] lg:leading-[4.875rem]"
          >
            Help basement Win <br />
            <span className="text-brand-o">Two Webby Awards</span>
          </motion.h1>

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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 w-full lg:w-[60%]"
          >
            <h3 className="mb-2 text-f-h4-mobile font-semibold lg:text-f-h4">
              Steps to Vote:
            </h3>
            <ol className="list-decimal space-y-1 pl-6 text-blog text-brand-w1 lg:text-blog">
              <li className="">Click on a category</li>
              <li className="">Connect your gmail account</li>
              <li className="">Vote for basement.studio projects</li>
            </ol>
          </motion.div>
        </div>
      </section>

      {/* Award Cards */}
      <section className="grid-layout">
        <div className="col-span-full grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* First Award */}
          <motion.a
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="corner-borders with-diagonal-lines group relative flex cursor-pointer flex-col overflow-hidden bg-brand-k p-6 md:p-8"
            href="https://bsmnt.link/WEBBY-1"
            target="_blank"
            onClick={() => {
              track("daylight_webby_vote_en")
            }}
          >
            {/* Decorative corner */}
            <div className="absolute -left-px -top-px h-[60px] w-[60px] border-l border-t border-brand-o"></div>
            <div className="absolute -bottom-px -right-px h-[60px] w-[60px] border-b border-r border-brand-o"></div>

            <div className="relative z-10 mb-8 aspect-video w-full overflow-hidden">
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
            </div>

            <div className="flex flex-col">
              <h2 className="text-f-h3-mobile font-bold text-brand-w1 md:text-f-h3">
                Daylight Computer Store
              </h2>
            </div>

            <div className="mt-6">
              <VoteButton />
            </div>
          </motion.a>

          {/* Second Award */}
          <motion.a
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="corner-borders with-diagonal-lines group relative flex cursor-pointer flex-col overflow-hidden bg-brand-k p-6 md:p-8"
            href="https://bsmnt.link/WEBBY-3"
            target="_blank"
            onClick={() => {
              track("nextjs_webby_vote_en")
            }}
          >
            {/* Decorative corner */}
            <div className="absolute -left-px -top-px h-[60px] w-[60px] border-l border-t border-brand-o"></div>
            <div className="absolute -bottom-px -right-px h-[60px] w-[60px] border-b border-r border-brand-o"></div>

            <div className="relative z-10 mb-8 aspect-video w-full overflow-hidden">
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
            </div>

            <div className="flex flex-col">
              <h2 className="text-f-h3-mobile font-bold text-brand-w1 md:text-f-h3">
                Next.js Conference
              </h2>
            </div>

            <div className="mt-6">
              <VoteButton />
            </div>
          </motion.a>
        </div>
      </section>
    </div>
  )
}

export default WebbyPage
