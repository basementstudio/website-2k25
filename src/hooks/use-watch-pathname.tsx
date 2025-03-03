"use client"

import { usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useState } from "react"

const context = createContext<{
  prevPathname: string
  currentPathname: string
}>({
  prevPathname: "",
  currentPathname: ""
})

export function PathnameProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState("")
  const [currentPathname, setCurrentPathname] = useState("")

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }
  }, [])

  useEffect(() => {
    setPrevPathname(currentPathname)
    setCurrentPathname(pathname)
  }, [pathname])

  // popstate event
  useEffect(() => {
    const handlePopstate = () => {
      setPrevPathname(currentPathname)
      setCurrentPathname(pathname)
    }
    window.addEventListener("popstate", handlePopstate)

    return () => {
      window.removeEventListener("popstate", handlePopstate)
    }
  }, [pathname])

  return (
    <context.Provider value={{ prevPathname, currentPathname }}>
      {children}
    </context.Provider>
  )
}

export function useWatchPathname() {
  const contextValue = useContext(context)

  if (!contextValue) {
    throw new Error("useWatchPathname must be used within a PathnameProvider")
  }

  return contextValue
}
