"use client"

import { useEffect } from "react"

import { QueryType } from "@/components/arcade-screen/query"
import { useArcadeStore } from "@/store/lab-store"

interface ArcadeDataHandlerProps {
  data: QueryType
}

export function ArcadeDataHandler({ data }: ArcadeDataHandlerProps) {
  const setData = useArcadeStore((state) => state.setData)

  useEffect(() => {
    setData(data)
  }, [data, setData])

  return null
}
