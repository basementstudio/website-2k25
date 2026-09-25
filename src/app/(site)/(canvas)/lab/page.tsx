import type { Metadata } from "next"

import { PageJsonLd } from "@/lib/structured-data/page-json-ld"

import { LabClient } from "./client"

export const metadata: Metadata = {
  title: "Lab",
  description:
    "Step into the basement.studio lab — an experimental playground where we prototype interactive WebGL, 3D, and creative engineering ideas.",
  alternates: {
    canonical: "https://basement.studio/lab"
  }
}

// The mobile user-agent redirect lives in proxy.ts so this page stays
// prerenderable (reading headers() here would force it dynamic).
const Laboratory = () => {
  return (
    <>
      <PageJsonLd />
      <LabClient />
    </>
  )
}

export default Laboratory
