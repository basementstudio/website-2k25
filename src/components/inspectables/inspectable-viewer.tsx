"use client"

import { RichText as BaseRichText } from "basehub/react-rich-text"
import { Fragment, useEffect, useState } from "react"

const RichText = BaseRichText as unknown as React.ComponentType<{
  content: Node[]
}>

import { useKeyPress } from "@/hooks/use-key-press"
import { cn } from "@/utils/cn"

import { useInspectable } from "./context"
import { fetchInspectable, Inspectable } from "./fetch-inspectable"

const Close = ({ handleClose }: { handleClose: () => void }) => (
  <button
    className="text-paragraph text-brand-w1"
    tabIndex={0}
    onClick={handleClose}
  >
    (X) <span className="actionable">Close</span>
  </button>
)

const Content = ({ data }: { data: Inspectable }) => (
  <>
    <h2 className="text-subheading text-brand-w1">{data._title}</h2>
    {data?.specs?.items && data.specs.items.length > 0 && (
      <div className="flex flex-col border-t border-brand-w1/20">
        {data.specs.items.map((spec) => (
          <Fragment key={spec._id}>
            <div className="grid grid-cols-3 gap-2 border-b border-brand-w1/20 pb-0.5 pt-px">
              <h3 className="col-span-1 text-paragraph text-brand-g1">
                {spec._title}
              </h3>
              <p className="col-span-2 text-paragraph text-brand-w2">
                {spec.value}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    )}
    <div className="mr-14 text-paragraph text-brand-w1">
      {data?.description?.json?.content && (
        <RichText content={data.description.json.content as any} />
      )}
    </div>
  </>
)

export const InspectableViewer = () => {
  const { selected, setSelected } = useInspectable()
  const [data, setData] = useState<Inspectable | null>(null)

  useKeyPress("Escape", () => setSelected(""))

  useEffect(() => {
    setData(null)

    if (!selected) return

    const fetchData = async () => {
      const data = await fetchInspectable({ id: selected })
      setData(data)
    }

    fetchData()
  }, [selected])

  const handleFocus = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 top-9 z-10 items-center",
        selected ? "flex" : "hidden"
      )}
      onFocus={handleFocus}
    >
      <div className="grid-layout h-full">
        <div className="pointer-events-auto col-start-2 col-end-5 grid grid-rows-[auto_1fr_auto]">
          <div className="row-span-1 flex h-[8.5rem] w-full items-end">
            <Close handleClose={() => setSelected(null)} />
          </div>
          <div className="row-span-1 flex flex-col justify-center gap-4">
            {data && <Content data={data} />}
          </div>
          <div className="row-span-1 h-[8.5rem] w-full" />
        </div>
        <div className="col-start-5 col-end-13 my-2 border border-brand-w1/20" />
      </div>
    </div>
  )
}
