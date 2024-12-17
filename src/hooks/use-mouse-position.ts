import { useEffect } from "react";
import { Vector2 } from "three";
import { clamp } from "three/src/math/MathUtils.js";
import { create } from "zustand";

export type MouseStore = {
  uv: Vector2;
  position: Vector2;
};

export const useMousePosition = create<MouseStore>(() => {
  return {
    uv: new Vector2(0.5, 0.5),
    position: new Vector2(0, 0),
  };
});

/** Should be executed once */
export const useTrackMouse = () => {
  const uv = useMousePosition((s) => s.uv);
  const position = useMousePosition((s) => s.position);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = clamp(event.clientX / window.innerWidth, 0, 1);
      const y = clamp(event.clientY / window.innerHeight, 0, 1);

      uv.set(isNaN(x) ? 0 : x, isNaN(y) ? 0 : y);
      position.set(event.clientX, event.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [uv, position]);
};
