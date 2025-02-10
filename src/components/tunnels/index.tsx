"use client"

import { Fragment, useId } from "react"
import tunnel from "tunnel-rat"

const _WebGL = tunnel()

const OriginalIn = _WebGL.In

const WebGLIn = ({
  id,
  lazy = true,
  children,
  ...props
}: React.ComponentProps<typeof _WebGL.In> & {
  id?: string | number
  lazy?: boolean
}) => {
  const componentId = useId()

  if (typeof id === "string") {
    return (
      <OriginalIn {...props} key={id}>
        {children}
      </OriginalIn>
    )
  }

  return (
    <OriginalIn {...props}>
      <Fragment key={componentId}>{children}</Fragment>
    </OriginalIn>
  )
}

export const WebGL = {
  Out: _WebGL.Out,
  In: WebGLIn
}

const _Html = tunnel()

const OriginalHtmlIn = _Html.In

export const HtmlIn = ({
  lazy = true,
  ...props
}: React.ComponentProps<typeof _Html.In> & { lazy?: boolean }) => {
  const id = useId()

  return (
    <OriginalHtmlIn {...props}>
      <Fragment key={id}>{props.children}</Fragment>
    </OriginalHtmlIn>
  )
}

export const HtmlOut = _Html.Out
