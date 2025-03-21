import MuxVideo, { Props } from "@mux/mux-video-react"

export const Video = (props: Partial<Props>) => (
  <MuxVideo
    {...props}
    style={{ "--controls": "none" } as React.CSSProperties}
    controls={false}
    streamType="on-demand"
    playsInline
    autoPlay={true}
    ref={props.ref}
    preload="auto"
  />
)
