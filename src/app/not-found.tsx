export default function NotFound() {
  return (
    <>
      <div className="fixed top-9 z-30 flex h-[calc(100dvh-36px)] w-full px-20 py-14">
        <div className="relative h-full w-full">
          <div className="absolute left-0 top-0">
            <div className="h-[60px] w-[2px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute top-0 h-[2px] w-[60px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute right-0 top-0">
            <div className="h-[60px] w-[2px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute right-0 top-0 h-[2px] w-[60px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute bottom-0 left-0">
            <div className="h-[60px] w-[2px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute bottom-0 h-[2px] w-[60px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>

          <div className="absolute bottom-0 right-0">
            <div className="h-[60px] w-[2px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
            <div className="absolute bottom-0 right-0 h-[2px] w-[60px] animate-pulse bg-white shadow-[0_0_10px_#fff,0_0_20px_#fff]" />
          </div>
        </div>
      </div>
    </>
  )
}
