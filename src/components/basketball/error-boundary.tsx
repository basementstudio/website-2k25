import React, { Component, ErrorInfo, ReactNode, useEffect } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export const ErrorFallback = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.reload()
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  return null
}
