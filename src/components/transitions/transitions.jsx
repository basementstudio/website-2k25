"use client"

import "./transitions.css"

import { useEffect } from "react"

const config = {
  theme: "system",
  cells: 32,
  frames: 12,
  speed: 0.25,
  delay: 0
}

let createSprites

export const Transitions = () => {
  useEffect(() => {
    document.documentElement.dataset.theme = config.theme
    document.documentElement.style.setProperty("--mask-speed", config.speed)
    document.documentElement.style.setProperty("--mask-delay", config.delay)

    // basic array shuffling function
    const shuffle = (arr) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
      return arr
    }
    // split array into chunks to use for groups
    const split = (arr, chunks) => {
      const chunkSize = Math.ceil(arr.length / chunks)
      const result = []
      for (let i = 0; i < arr.length; i += chunkSize) {
        result.push(arr.slice(i, i + chunkSize))
      }
      return result
    }
    // convert SVG element into a data URL for CSS mask, etc.
    const svgToUrl = (svg) => {
      const svgString = new XMLSerializer().serializeToString(svg)
      const encodedSvg = encodeURIComponent(svgString)
        .replace(/'/g, "%27")
        .replace(/"/g, "%22")
      return `data:image/svg+xml;charset=utf-8,${encodedSvg}`
    }

    // this will generate an SVG sprite based on the given configuration
    const generateSprite = (prefix) => {
      const indices = split(
        shuffle(new Array(config.cells ** 2).fill(0).map((_, i) => i)),
        config.frames
      )
      const svgNamespace = "http://www.w3.org/2000/svg"
      const svg = document.createElementNS(svgNamespace, "svg")
      svg.setAttribute("xmlns", svgNamespace)
      svg.setAttribute(
        "viewBox",
        `0 0 ${config.cells * 10 * (indices.length + 1)} ${config.cells * 10}`
      ) // Adjust viewBox to fit the grid
      svg.setAttribute("class", "sprite")

      const defs = document.createElementNS(svgNamespace, "defs")
      // add a starter frame that's empty?
      // generate the paths and put them in a defs slot
      for (let f = 0; f < indices.length; f++) {
        // generate a path per frame: M10 10 h20 v20 h-20 z
        const positions = indices[f]
        let d = ""
        for (let p = 0; p < positions.length; p++) {
          const x = positions[p] % config.cells
          const y = Math.floor(positions[p] / config.cells)
          d += `M${x * 10} ${y * 10} h10 v10 h-10 z `
        }
        // create the path and give it the "D" lol
        const path = document.createElementNS(svgNamespace, "path")
        path.setAttribute("d", d)
        path.setAttribute("fill", "currentColor")
        path.setAttribute("stroke", "currentColor")
        path.setAttribute("shape-rendering", "crispEdges")
        path.setAttribute("stroke-width", "0.025")
        path.setAttribute("id", `${prefix}-${f}`)
        defs.appendChild(path)

        // whilst here, may aswell create the frame group as well
        const group = document.createElementNS(svgNamespace, "g")
        for (let u = 0; u < f + 1; u++) {
          const use = document.createElementNS(svgNamespace, "use")
          use.setAttribute("href", `#${prefix}-${u}`)
          use.setAttribute("x", (f + 1) * (config.cells * 10))
          group.appendChild(use)
        }
        svg.appendChild(group)
      }

      svg.appendChild(defs)
      const dataURL = svgToUrl(svg)

      document.documentElement.style.setProperty(
        "--mask-frames",
        indices.length
      )

      return { svg, dataURL }
    }

    createSprites = () => {
      const { dataURL: outURL } = generateSprite("o")
      const { dataURL: inURL } = generateSprite("i")
      document.documentElement.style.setProperty("--mask-in", `url(${inURL})`)
      document.documentElement.style.setProperty("--mask-out", `url(${outURL})`)
    }

    createSprites()
  }, [])

  useEffect(() => {
    document.documentElement.dataset.disabled = true

    const handleScroll = () => {
      const scrolled = window.scrollY
      const viewportHeight = window.innerHeight
      document.documentElement.dataset.disabled = scrolled <= viewportHeight
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return null
}
