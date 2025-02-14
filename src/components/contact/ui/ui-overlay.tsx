import { cn } from "@/utils/cn"

const UiOverlay = ({ className }: { className?: string }) => {
  return (
    <div className={cn("z-50", className)}>
      <div className="px-4 text-xs">
        <div className="border border-gray-300 p-4">
          <div className="mb-4 flex gap-4">
            <input
              type="text"
              placeholder="NAME"
              className="w-1/2 bg-blue-50 p-2 focus:outline-none focus:ring-1 focus:ring-blue-200"
            />
            <input
              type="text"
              placeholder="COMPANY"
              className="w-1/2 bg-orange-50 p-2 focus:outline-none focus:ring-1 focus:ring-orange-200"
            />
          </div>

          <input
            type="email"
            placeholder="EMAIL"
            className="mb-4 w-full bg-green-50 p-2 focus:outline-none focus:ring-1 focus:ring-green-200"
          />

          <input
            type="text"
            placeholder="BUDGET (OPTIONAL)"
            className="mb-4 w-full bg-red-50 p-2 focus:outline-none focus:ring-1 focus:ring-red-200"
          />

          <textarea
            placeholder="MESSAGE"
            className="mb-4 h-12 w-full bg-purple-50 p-2 focus:outline-none focus:ring-1 focus:ring-purple-200"
          />

          <button className="w-full bg-yellow-100 p-2 text-center transition-colors hover:bg-yellow-200">
            SUBMIT MESSAGE -&gt;
          </button>

          <div className="mt-4 flex justify-between">
            <div className="flex gap-2">
              <a
                href="#"
                className="bg-green-100 px-2 transition-colors hover:bg-green-200"
              >
                X (TWITTER)
              </a>
              ,
              <a
                href="#"
                className="bg-red-100 px-2 transition-colors hover:bg-red-200"
              >
                INSTAGRAM
              </a>
              ,
              <a
                href="#"
                className="bg-blue-100 px-2 transition-colors hover:bg-blue-200"
              >
                GITHUB
              </a>
            </div>
            <a
              href="#"
              className="bg-pink-100 px-2 transition-colors hover:bg-pink-200"
            >
              HELLO@BASEMENT.STUDIO
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UiOverlay
