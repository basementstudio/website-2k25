"use client"

import { RichText as BaseRichText } from "basehub/react-rich-text"
import { Fragment, useEffect, useState } from "react"

import { useAssets } from "@/components/assets-provider"
import { AssetsResult } from "@/components/assets-provider/fetch-assets"
import { useInspectable } from "@/components/inspectables/context"
import { cn } from "@/utils/cn"

type InspectableData = AssetsResult["inspectables"][number]

const Close = ({ handleClose }: { handleClose: () => void }) => (
  <button className="text-p text-brand-w1" tabIndex={0} onClick={handleClose}>
    (X) Close
  </button>
)

const Content = ({ data }: { data: InspectableData }) => (
  <>
    <h2 className="text-h2 text-brand-w1">{data._title}</h2>
    {data?.specs && data.specs.length > 0 && (
      <div className="flex flex-col border-t border-brand-w1/20">
        {data.specs.map((spec) => (
          <Fragment key={spec._id}>
            <div className="grid grid-cols-7 gap-2 border-b border-brand-w1/20 pb-1 pt-0.75">
              <h3 className="col-span-2 text-p text-brand-g1">{spec._title}</h3>
              <p className="col-span-5 text-p text-brand-w2">{spec.value}</p>
            </div>
          </Fragment>
        ))}
      </div>
    )}
    <div className="mr-14 text-p text-brand-w1">
      {data?.description?.json?.content && (
        <BaseRichText content={data.description.json.content as any} />
      )}
    </div>
  </>
)

export const InspectableViewer = () => {
  const { inspectables } = useAssets()
  const { selected, setSelected } = useInspectable()
  const [data, setData] = useState<InspectableData | null>(null)

  useEffect(() => {
    setData(null)

    if (!selected) return

    const fetchData = async () => {
      const inspectableData = inspectables.find(
        (inspectable) => inspectable.mesh === selected
      )

      setData(inspectableData ?? null)
    }

    fetchData()
  }, [selected, inspectables])

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 top-9 z-10 items-center",
        selected ? "flex" : "hidden"
      )}
    >
      <div className="grid-layout h-full">
        <div className="col-start-1 col-end-9 my-3 border border-brand-w1/20" />
        <div className="pointer-events-auto col-start-9 col-end-13 grid grid-cols-8">
          <div className="col-start-2 col-end-9 flex flex-col gap-18">
            <div className="row-span-1 flex h-44 w-full items-end">
              <Close handleClose={() => setSelected(null)} />
            </div>
            <div className="row-span-1 flex flex-col justify-center gap-4">
              {data && <Content data={data} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
