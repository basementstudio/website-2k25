"use client";

import { cn } from "@/utils/cn";
import { useInspectable } from "./context";

export const InspectableModal = () => {
  const { selected } = useInspectable();

  return (
    <div
      className={cn(
        selected &&
          "pointer-events-none absolute inset-0 z-10 flex items-center p-24",
      )}
    >
      <div className="pointer-events-auto inset-0 z-10 h-96 w-96 bg-red-400/40">
        {selected}
      </div>
    </div>
  );
};
