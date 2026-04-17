import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Contact } from "@/components/layout/contact"
import { getImageUrl } from "@/service/sanity/helpers"

import { Crew } from "./crew"
import { Hero } from "./hero"
import { OpenPositions } from "./open-positions"
import { PreOpenPositions } from "./pre-open-positions"
import type { PersonDisplay } from "./sanity"
import {
  fetchOpenPositions,
  fetchPeople,
  fetchPeoplePage,
  fetchValues
} from "./sanity"
import { Values } from "./values"

export const metadata: Metadata = {
  title: "People",
  alternates: {
    canonical: "https://basement.studio/people"
  }
}

const About = async () => {
  const [pageData, people, values, openPositions] = await Promise.all([
    fetchPeoplePage(),
    fetchPeople(),
    fetchValues(),
    fetchOpenPositions()
  ])

  if (!pageData) notFound()

  const peopleDisplay: PersonDisplay[] = people.map((p) => {
    const img = p.image ? getImageUrl(p.image) : null
    return {
      title: p.title,
      department: p.department?.title ?? null,
      role: p.role,
      image: img
        ? {
            url: img.src,
            width: img.width,
            height: img.height,
            alt: p.image?.alt ?? null,
            blurDataURL: img.blurDataURL ?? null
          }
        : null,
      socialNetworks: p.socialNetworks
    }
  })

  return (
    <>
      <Hero data={pageData} />
      <Values data={values} />
      <Crew data={peopleDisplay} />
      <PreOpenPositions data={pageData} />
      <OpenPositions data={openPositions} />
      <Contact />
    </>
  )
}

export default About
