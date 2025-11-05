import { useEffect } from "react"

export const useConsoleLogo = () => {
  useEffect(() => {
    console.log(
      `%c
██████╗ ███████╗███╗   ███╗███╗   ██╗████████╗
██╔══██╗██╔════╝████╗ ████║████╗  ██║╚══██╔══╝
██████╔╝███████╗██╔████╔██║██╔██╗ ██║   ██║   
██╔══██╗╚════██║██║╚██╔╝██║██║╚██╗██║   ██║   
██████╔╝███████║██║ ╚═╝ ██║██║ ╚████║   ██║   
╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝   ╚═╝   
Making cool shit that performs.`,
      "font-family: 'Geist Mono', 'Menlo', 'Monaco', 'Courier', monospace; font-size: 13px"
    )
  }, [])
}
