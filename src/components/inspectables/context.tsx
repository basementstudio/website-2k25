"use client"

import { createContext, useContext, useState } from "react"

interface InspectableContextType {
  selected: string | null
  setSelected: (inspectable: string | null) => void
}

const InspectableContext = createContext<InspectableContextType | null>(null)

export const useInspectable = () => {
  const inspectable = useContext(InspectableContext)
  if (!inspectable)
    throw new Error("useInspectable must be used within an InspectableProvider")
  return inspectable
}

interface InspectableProviderProps {
  children: React.ReactNode
}

export const InspectableProvider = ({ children }: InspectableProviderProps) => {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <InspectableContext.Provider value={{ selected, setSelected }}>
      {children}
    </InspectableContext.Provider>
  )
}
