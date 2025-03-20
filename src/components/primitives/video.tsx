import MuxVideo, { Props } from "@mux/mux-video-react"

export const Video = (props: Partial<Props>) => {
  return (
    <MuxVideo
      {...props}
      style={{ "--controls": "none" } as React.CSSProperties}
      controls={false}
      streamType="on-demand"
      playsInline
      ref={props.ref}
      preload="auto"
    />
  )
}
