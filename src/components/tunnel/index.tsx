"use client"

import type { JSX } from "react"
import { Fragment, useId } from "react"
import tunnel from "tunnel-rat"

const _WebGL = tunnel()

const OriginalIn = _WebGL.In

function WebGLIn({
  id,
  children,
  ...props
}: React.ComponentProps<typeof _WebGL.In> & {
  id?: string | number
}): JSX.Element {
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
      <Fragment key={componentId}> {children} </Fragment>
    </OriginalIn>
  )
}

export const WebGlTunnelOut = _WebGL.Out
export const WebGlTunnelIn = WebGLIn

const _Html = tunnel()

const OriginalHtmlIn = _Html.In

function HtmlIn({
  ...props
}: React.ComponentProps<typeof _Html.In>): JSX.Element {
  const id = useId()

  return (
    <OriginalHtmlIn {...props}>
      <Fragment key={id}> {props.children} </Fragment>
    </OriginalHtmlIn>
  )
}

export const HtmlTunnelOut = _Html.Out
export const HtmlTunnelIn = HtmlIn
